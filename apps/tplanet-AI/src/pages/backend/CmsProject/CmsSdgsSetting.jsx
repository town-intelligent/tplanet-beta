import "../progress_bar.css";
import { useState, useEffect } from "react";
import { Card, Form } from "react-bootstrap";
import { plan_info } from "../../../utils/Plan";
import { useParams } from "react-router-dom";
import { sdgsAutoGen, getWeightMeta } from "../../../utils/sdgs/Weight";
import {
  handlePreview,
  handlePrevious,
  handleNextPage,
  handleSave,
} from "../../../utils/CmsAgent";
import { useTranslation } from "react-i18next";

const CmsSdgsSetting = () => {
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const WEIGHTS = ["SDGs"];
  const [weightData, setWeightData] = useState([]);
  const { t } = useTranslation();

  useEffect(() => {
    if (id) {
      fetchSDGsData();
    }
  }, [id]);

  const fetchSDGsData = async () => {
    setIsLoading(true);
    try {
      const projectInfo = await plan_info(id);

      let sdgsList = projectInfo.weight
        ? projectInfo.weight.split(",")
        : Array(27).fill("0");

      const allZeros = sdgsList.every((value) => value === "0");

      if (allZeros) {
        try {
          const result = await sdgsAutoGen(id);
          // Backend may wrap payloads differently depending on deployment.
          // Normalize to an object like: { project_sdgs: [...] }.
          let parsedResult = result;
          if (parsedResult && typeof parsedResult === "object" && parsedResult.data) {
            parsedResult = parsedResult.data;
          }
          if (parsedResult && typeof parsedResult === "object" && parsedResult.content !== undefined) {
            parsedResult = parsedResult.content;
          }
          if (typeof parsedResult === "string") {
            parsedResult = JSON.parse(parsedResult);
          }

          if (parsedResult.project_sdgs?.length > 0) {
            const projectSDGs = parsedResult.project_sdgs[0];

            localStorage.setItem("ai_sdgs", JSON.stringify(projectSDGs));

            sdgsList = sdgsList.map((_, index) =>
              projectSDGs[index + 1] ? "1" : "0"
            );
          }
        } catch (error) {
          console.error("Error fetching AI generated SDGs:", error);
        }
      }

      const weightDetails = [];
      let globalIdCounter = 1;

      for (const weight of WEIGHTS) {
        const data = await getWeightMeta(weight);
        const categories = data.content.categories.map((category) => {
          const uniqueId = `sdg_${globalIdCounter}`;
          globalIdCounter++;
          return {
            title: category.title,
            id: uniqueId,
            isChecked: parseInt(sdgsList[uniqueId.split("_")[1] - 1]) !== 0,
          };
        });

        weightDetails.push({
          weightId: weight,
          categories: categories,
        });
      }

      setWeightData(weightDetails);
    } catch (error) {
      console.error("Error fetching SDGs data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryToggle = (weightId, categoryId) => {
    setWeightData((prevData) =>
      prevData.map((weight) => {
        if (weight.weightId === weightId) {
          return {
            ...weight,
            categories: weight.categories.map((category) =>
              category.id === categoryId
                ? { ...category, isChecked: !category.isChecked }
                : category
            ),
          };
        }
        return weight;
      })
    );
  };

  // 檢查所有 SDGs 是否至少有一個勾選
  const validateSdgsSelection = () => {
    const hasChecked = weightData.some((weight) =>
      weight.categories.some((category) => category.isChecked)
    );

    if (!hasChecked) {
      alert(t("cmsSdgsSetting.validate_sdgs_required"));
      return false;
    }
    return true;
  };


  if (!id) return null;

  return (
    <div className="container pt-3">
      <ul className="progressbar">
        <li className="active done">
          <span>{t("progressbar.step1")}</span>
        </li>
        <li className="active">
          <span>{t("progressbar.step2")}</span>
        </li>
        <li>
          <span>{t("progressbar.step3")}</span>
        </li>
        <li>
          <span>{t("progressbar.step4")}</span>
        </li>
        <li>
          <span></span>
        </li>
      </ul>

      <section>
        <div className="container pt-5">
          <div className="form-row align-items-center mt-5">
            <div className="col-12 px-0">
              <p className="bg-[#317EE0] py-2 text-white pl-6">
                {t("cmsSdgsSetting.title")}
              </p>
            </div>
          </div>

          <form id="weight_container" action="">
            {/* 權重項目會動態生成並添加到這裡 */}

            <div>
              {isLoading ? (
                <div
                  id="loading-container"
                  className="loading-container hidden"
                >
                  <div className="spinner-border" role="status">
                    <span className="sr-only">{t("cmsSdgsSetting.loading_sdgs")}</span>
                  </div>
                  <p>{t("cmsSdgsSetting.loading_sdgs_2")}</p>
                </div>
              ) : (
                weightData.map((weight) => (
                  <Card key={weight.weightId} className="mb-3">
                    <Card.Body>
                      <div className="row text-xl">
                        {weight.categories.map((category) => (
                          <div
                            key={category.id}
                            className="col-12 col-sm-6 col-md-4 mb-3"
                          >
                            <Form.Check
                              type="checkbox"
                              id={category.id}
                              label={category.title}
                              checked={category.isChecked}
                              onChange={() =>
                                handleCategoryToggle(
                                  weight.weightId,
                                  category.id
                                )
                              }
                            />
                          </div>
                        ))}
                      </div>
                    </Card.Body>
                  </Card>
                ))
              )}
            </div>

            {/* 按鈕 */}
            <div className="row mt-5 mb-5 pb-3 justify-content-center">
              <div className="col-md-8 mt-5">
                <div className="flex flex-col md:flex-row justify-between space-y-3 md:space-y-0 md:space-x-3">
                  <button
                    type="submit"
                    id="btn_cms_plan_preview"
                    className="btn btn-secondary rounded-pill w-full md:w-1/5"
                    onClick={(event) => handlePreview(event, weightData, id)}
                  >
                    {t("cmsbutton.preview")}
                  </button>
                  <button
                    type="submit"
                    id="btn_cms_plan_preview"
                    className="btn btn-dark rounded-pill w-full md:w-1/5"
                    onClick={(event) => handlePrevious(event, id)}
                  >
                    {t("cmsbutton.previous")}
                  </button>
                  <button
                    type="button"
                    id="btn_ab_project_next"
                    className="btn btn-dark rounded-pill w-full md:w-1/5"
                    onClick={(event) => {
                      event.preventDefault();
                      if (validateSdgsSelection()) {
                        handleNextPage(event, weightData, id);
                      }
                    }}
                  >
                    {t("cmsbutton.next")}
                  </button>
                  <button
                    type="submit"
                    id="btn_cms_plan_save"
                    className="btn btn-success rounded-pill w-full md:w-1/5"
                    onClick={(event) => handleSave(event, weightData, id)}
                  >
                    {t("cmsbutton.save")}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
};

export default CmsSdgsSetting;
