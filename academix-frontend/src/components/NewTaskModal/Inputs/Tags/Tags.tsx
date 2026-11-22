import React, { useState, useRef, useEffect } from "react";
import { Tag, Select, Input, notification } from "antd";
import type { SelectProps } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useSelectionsStore } from "../../../../store/selectionStore";
import { useFetchTagsByCourseId } from "../../../../hooks/useFetchTagsByCourseId";
import style from "./Tags.module.css";
import { useTaskStore } from "../../../../store/taskStore";
import { queryClient } from "../../../../api/queryClient";
import { createTag } from "../../../../services/ApiServices";

interface TagOption {
  id: number;
  tagName: string;
}

interface EditableTagGroupProps {
  initial?: TagOption[];
  onChange?: (selected: TagOption[]) => void;
  setIsChange?: any;
  locked?: boolean | undefined;
}

const EditableTagGroup: React.FC<EditableTagGroupProps> = ({
  initial = [],
  onChange,
  setIsChange,
  locked,
}) => {
  const [selectedTags, setSelectedTags] = useState<TagOption[]>(initial);
  const [selectVisible, setSelectVisible] = useState(false);
  const [newTagInput, setNewTagInput] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const selectRef = useRef<any>(null);
  const [available, setAvailable] = useState<TagOption[]>([]);
  const { selectedCourse } = useSelectionsStore();
  const fetchedCourseTags = useFetchTagsByCourseId(Number(selectedCourse?.id));
  const taskInStore = useTaskStore((state) => state.task);
  const setTaskInStore = useTaskStore((state) => state.addTask);

  useEffect(() => {
    if (fetchedCourseTags?.data) {
      setAvailable(
        fetchedCourseTags?.data?.map((gs: any) => ({
          id: gs?.id,
          tagName: gs?.tagName,
        }))
      );
    }
  }, [JSON.stringify(fetchedCourseTags?.data), selectedCourse?.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        !target.closest(".ant-select-dropdown")
      ) {
        setSelectVisible(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fireChange = (newTags: TagOption[]) => {
    setSelectedTags(newTags);
    setIsChange(true);
    setTaskInStore({ ...taskInStore, tags: newTags });
    onChange?.(newTags);
  };

  const handleCreateTag = async () => {
    if (!newTagInput.trim()) {
      notification.error({
        message: "לא ניתן ליצור תיוג ללא שם!",
        duration: 1,
        placement: "top",
        style: { direction: "rtl" },
      });
      return;
    }

    try {
      const tagToSend = {
        name: newTagInput.trim(),
        courseid: selectedCourse?.id,
      };

      const res = await createTag(tagToSend);
      if (res?.status === 200) {
        notification.success({
          message: "התג נוצר בהצלחה",
          duration: 1,
          placement: "top",
          style: { direction: "rtl" },
        });

        const newTag: TagOption = {
          id: res?.data?.id,
          tagName: newTagInput.trim(),
        };

        fireChange([...selectedTags, newTag]);
        queryClient.invalidateQueries({ queryKey: ["tags"] });
        setNewTagInput("");
      } else if (res?.status === 401) {
        notification.error({
          message: "קיים כבר תיוג בשם זה בקורס זה!",
          duration: 1,
          placement: "top",
          style: { direction: "rtl" },
        });
      }
    } catch (error) {
      console.log(error);
    }
  };
  const handleClose = (removed: TagOption) => {
    fireChange(selectedTags.filter((t) => t.id !== removed.id));
  };

  const handleSelect = (value: number) => {
    const added = available.find((t) => t.id === value);
    if (!added) {
    
      return;
    }
    if (!selectedTags.some((t) => t.id === added.id)) {
      fireChange([...selectedTags, added]);
    }
  };

  const openSelect = () => {
    if (locked) return;
    setSelectVisible(true);
    setTimeout(() => selectRef.current?.focus(), 0);
  }

  const tagElements = selectedTags?.map((tag) => (
    <span
      key={tag.id}
      style={{
        display: "inline-block",
        fontSize: "16px !important",
      }}
    >
      <Tag
        closable={locked ? false : true}
        onClose={(e) => {
          e.preventDefault();
          handleClose(tag);
        }}
      >
        {tag.tagName}
      </Tag>
    </span>
  ));

  const selectableOptions = available
    .filter((opt) => !selectedTags.some((t) => t.id === opt.id))
    .map((opt) => ({
      label: opt.tagName,
      value: opt.id,
    }));

  const selectProps: SelectProps<number> = {
    style: { width: 120 },
    placeholder: "בחר תיוג",
    options: selectableOptions,
    onSelect: handleSelect,
    showSearch: true,
    filterOption: (input, option) =>
      (option?.label as string).toLowerCase().includes(input.toLowerCase()),
    dropdownRender: (menu) => (
      <>
        {menu}
        <div style={{ padding: "8px", borderTop: "1px solid #f0f0f0" }}>
          <Input
            placeholder="תיוג חדש"
            value={newTagInput}
            onChange={(e) => setNewTagInput(e.target.value)}
            onPressEnter={handleCreateTag}
          />
        </div>
      </>
    ),
  };

  return (
    <div className={style.wrapper} ref={containerRef}>
      {selectVisible ? (
        <Select<number>
          ref={selectRef}
          {...selectProps}
          disabled={locked}
          open={selectVisible}
          onOpenChange={(open) => {
            if (open) setSelectVisible(true);
          }}
        />
      ) : (
        <Tag
          onClick={openSelect}
          className={
            locked ? style["site-tag-plus_locked"] : style["site-tag-plus"]
          }
          style={{
            background: "#fff",
            borderStyle: "dashed",
            cursor: locked ? "not-allowed" : "pointer",
          }}
        >
          <PlusOutlined /> תיוג חדש
        </Tag>
      )}
      <div
        style={{
          display: "flex",
          gap: "5px",
          overflowX: "auto",
          paddingBottom: "2px",
        }}
      >
        {tagElements}
      </div>
    </div>
  );
};

export default EditableTagGroup;