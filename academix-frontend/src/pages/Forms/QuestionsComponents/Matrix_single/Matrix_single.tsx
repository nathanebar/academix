// QuestionsComponents/MatchingPairs/MatchingPairs.tsx
import { useEffect, useRef, useState } from "react";
import { QuestionProps } from "../../../../types/types";
import style from "./MatchingPairs.module.css";
import { Button } from "antd";
import QuestionFooter from "../../QuestionFooter/QuestionFooter";

type Connection = { rightId: string | number; leftId: string | number };

const MatchingPairs = (props: QuestionProps) => {
  const [mergedOptions, setMergedOptions] = useState<any>();
  const [selectedId, setSelectedId] = useState<string | number | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const refs = useRef<Record<string, HTMLElement>>({});
  const [_, forceRender] = useState(0);
  const isAnswer = props.renderFor === "answer";

  /* ✅ resync : formData (answer) / submission (show-grading) */
  useEffect(() => {
    const source = isAnswer ? props.formData || [] : props.submission || [];
    const conns = source
      .filter((c: any) => c.right_option_id && c.left_option_id)
      .map((c: any) => ({
        rightId: c.right_option_id,
        leftId: c.left_option_id,
      }));
    setConnections(conns);
  }, [JSON.stringify(isAnswer ? props.formData : props.submission)]);

  useEffect(() => {
    const redraw = () => forceRender((v) => v + 1);
    window.addEventListener("resize", redraw);
    window.addEventListener("orientationchange", redraw);
    const ro = new ResizeObserver(redraw);
    if (containerRef.current) ro.observe(containerRef.current);
    Object.values(refs.current).forEach((el) => el && ro.observe(el));
    return () => {
      window.removeEventListener("resize", redraw);
      window.removeEventListener("orientationchange", redraw);
      ro.disconnect();
    };
  }, []);

  useEffect(() => {
    const left = props.options.filter((op: any) => op?.side === "left");
    const right = props.options.filter((op: any) => op?.side === "right");
    setMergedOptions(
      left.map((l: any, i: number) => ({ left: l, right: right[i] }))
    );
  }, []);

  useEffect(() => {
    forceRender((v) => v + 1);
  }, [connections, mergedOptions]);

  const getCenter = (el: HTMLElement) => {
    const r = containerRef.current?.getBoundingClientRect();
    const e = el.getBoundingClientRect();
    return {
      x: e.left + e.width / 2 - (r?.left || 0),
      y: e.top + e.height / 2 - (r?.top || 0),
    };
  };

  // Construire une map des connexions : id -> id partenaire
  const partnerMap: Record<string | number, string | number> = {};
  connections.forEach((c) => {
    partnerMap[c.rightId] = c.leftId;
    partnerMap[c.leftId] = c.rightId;
  });

  const removeConnection = (conn: Connection) => {
    // Supprimer de formData
    props.setFormData((prev: any) => {
      const prevArr = Array.isArray(prev) ? prev : [];
      return prevArr.filter(
        (item: any) =>
          !(
            item.right_option_id === conn.rightId &&
            item.left_option_id === conn.leftId
          )
      );
    });

    // Supprimer localement
    setConnections((prev) =>
      prev.filter(
        (c) => !(c.rightId === conn.rightId && c.leftId === conn.leftId)
      )
    );
    setSelectedId(null);
  };

  const handleClick = (id: string | number) => {
    if (!isAnswer) return;
    const option = props.options.find((op: any) => op.id === id);
    if (!option) return;
    const side = option.side;

    // Si l'option est déjà connectée → annuler la connexion
    if (partnerMap[id]) {
      const conn = connections.find((c) => c.rightId === id || c.leftId === id);
      if (conn) removeConnection(conn);
      return;
    }

    // Premier clic : on mémorise l'option (gauche ou droite)
    if (!selectedId) {
      setSelectedId(id);
      return;
    }

    // Deux clics sur le même côté → on change la sélection
    const selectedOption = props.options.find(
      (op: any) => op.id === selectedId
    );
    if (selectedOption && selectedOption.side === side) {
      setSelectedId(id);
      return;
    }

    // Deux clics sur des côtés opposés → création du lien
    const rightId = side === "right" ? id : selectedId;
    const leftId = side === "left" ? id : selectedId;
    const newConn: Connection = { rightId, leftId };

    // Ajouter à formData
    props.setFormData((prev: any) => {
      const prevArr = Array.isArray(prev) ? prev : [];
      return [
        ...prevArr,
        {
          form_question_id: props.questionId,
          right_option_id: rightId,
          left_option_id: leftId,
        },
      ];
    });

    // Ajouter localement
    setConnections((prev) => [...prev, newConn]);
    setSelectedId(null);
  };

  const removeAll = () => {
    props.setFormData((prev: any) => {
      const prevArr = Array.isArray(prev) ? prev : [];
      return prevArr.filter(
        (op: any) => !("right_option_id" in op && "left_option_id" in op)
      );
    });
    setConnections([]);
    setSelectedId(null);
  };

  return (
    <div className={style.card}>
      <div className={style.question}>מתח קו בין המילים המתאימות</div>

      <div ref={containerRef} className={style.svgArea}>
        <svg className={style.svg}>
          {connections.map((c, i) => {
            const from = refs.current[c.rightId];
            const to = refs.current[c.leftId];
            if (!from || !to) return null;
            const f = getCenter(from);
            const t = getCenter(to);
            return (
              <line
                key={i}
                x1={f.x}
                y1={f.y}
                x2={t.x}
                y2={t.y}
                stroke="#c77f00"
                strokeWidth={3}
                style={{ cursor: "pointer" }}
                onClick={() => removeConnection(c)}
              />
            );
          })}
        </svg>

        <div className={style.optionsGrid}>
          {mergedOptions?.map((op: any, i: number) => (
            <div key={i} className={style.row}>
              <div
                ref={(el: any) => (refs.current[op.right.id] = el!)}
                onClick={() => handleClick(op.right.id)}
                className={`${style.option} ${style.optionRight} ${
                  partnerMap[op.right.id] ? style.connected : ""
                } ${selectedId === op.right.id ? style.selected : ""}`}
              >
                {op.right?.option_text}
              </div>
              <div
                ref={(el: any) => (refs.current[op.left.id] = el!)}
                onClick={() => handleClick(op.left.id)}
                className={`${style.option} ${style.optionLeft} ${
                  partnerMap[op.left.id] ? style.connected : ""
                } ${selectedId === op.left.id ? style.selected : ""}`}
              >
                {op.left?.option_text}
              </div>
            </div>
          ))}
        </div>
      </div>

      {isAnswer && connections.length > 0 && (
        <Button onClick={removeAll} className={style.clearBtn}>
          בטל בחירות
        </Button>
      )}

      <QuestionFooter props={props} trigger={false} setTrigger={() => {}} />
    </div>
  );
};

export default MatchingPairs;
