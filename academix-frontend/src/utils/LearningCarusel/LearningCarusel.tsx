import { Button, Carousel, ConfigProvider } from "antd";
import { useRef } from "react";
import style from "./LearningCarusel.module.css";

type Props = {
  slides: Array<{
    id: string | number;
    title?: string;
    descriptions?: string;
    steps?: string[];
    tip?: string;
    image: string;
  }>;
};

const LearningCarusel = ({ slides }: Props) => {
  const carouselRef = useRef<any>(null);

  const handlePrev = () => {
    carouselRef.current?.prev();
  };

  const handleNext = () => {
    carouselRef.current?.next();
  };

  return (
    <ConfigProvider
      theme={{
        components: {
          Carousel: {
            colorBgContainer: "blue",
            dotHeight: "1vh",
            dotActiveWidth: "3vw",
          },
        },
      }}
    >
      <div className={style.mainDiv}>
        <Carousel ref={carouselRef} style={{ height: "70vh" }} dots={true}>
          {slides.map((slide) => (
            <div key={slide.id}>
              <div className={style.centerDiv}>
                <div className={style.title}>
                  <h1>{slide.title}</h1>
                  <span
                    className={style.count}
                  >{`${slide.id} מתוך ${slides.length}`}</span>
                </div>
                <h3>{slide.descriptions}</h3>
                <div className={style.firstDiv}>
                  <div className={style.stepsDiv}>
                    {slide.steps?.map((step, index) => (
                      <div
                        key={index}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        <span className={style.stepNumber}>{index + 1}</span>
                        <span className={style.step}>{step}</span>
                      </div>
                    ))}
                  </div>

                  <div className={style.imageDiv}>
                    <img
                      className={style.image}
                      typeof="png"
                      src={slide?.image}
                      alt={slide.title}
                      // the carousel renders every slide of the subject: fetch the off-screen ones lazily
                      loading="lazy"
                      decoding="async"
                      onClick={() => window.open(slide?.image, "_blank")}
                    />
                  </div>
                </div>
                <br />
                <div className={style.tipDiv}>
                  <h3>טיפ מקצועי 💡</h3>
                  <span style={{ fontSize: "18px" }}>{slide.tip}</span>
                </div>
                <div
                  style={{
                    width: "100%",
                    border: "1px solid rgba(128, 128, 128, 0.158)", // TODO(tokens)
                    marginTop: "3vh",
                  }}
                ></div>
              </div>
            </div>
          ))}
        </Carousel>

        <div className={style.buttonsDiv}>
          <Button className={style.buttons} onClick={handlePrev}>
            {"<"} הקודם
          </Button>
          <Button className={style.buttons} onClick={handleNext}>
            הבא {">"}
          </Button>
        </div>
      </div>
    </ConfigProvider>
  );
};

export default LearningCarusel;
