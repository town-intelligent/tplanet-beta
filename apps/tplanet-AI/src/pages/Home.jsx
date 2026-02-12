import React, { useEffect, useState, useRef } from "react";
import { useHosters } from "../utils/multi-tenant";
import TrHtml from "../utils/TrHtml.jsx";
import { AnimatedSection } from "../utils/useScrollAnimation";

const Home = () => {
  const hosters = useHosters();
  const hasFetched = useRef(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!hosters.length || hasFetched.current) return;
    hasFetched.current = true;

    const mockup_get = async () => {
      const form = new FormData();
      form.append("email", hosters[0]);

      try {
        const response = await fetch(
          `${import.meta.env.VITE_HOST_URL_TPLANET}/api/mockup/get`,
          {
            method: "POST",
            body: form,
          }
        );

        const obj = await response.json();
        if (obj.result !== false && Object.keys(obj.description).length > 0) {
          setData(obj.description);
        }
      } catch (e) {
        console.log(e);
      } finally {
        setLoading(false);
      }
    };

    mockup_get();
  }, [hosters]);

  // Loading 狀態
  if (loading) {
    return (
      <section className="flex-grow mt-5">
        <div className="flex flex-col items-center justify-center py-40">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--tenant-primary)] border-t-transparent mb-4"></div>
          <p className="text-gray-600">載入中...</p>
        </div>
      </section>
    );
  }

  // 沒有資料
  if (!data) {
    return (
      <section className="flex-grow mt-5">
        <div className="flex flex-col items-center justify-center py-40">
          <p className="text-gray-600">尚未設定首頁內容</p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex-grow mt-5 overflow-hidden">
      {/* Banner - 淡入放大效果 */}
      <AnimatedSection animation="zoom-in" className="container mx-auto px-0">
        <div className="text-center">
          <img
            className="img-fluid"
            id="Tbanner_image"
            src={`${import.meta.env.VITE_HOST_URL_TPLANET}${data["banner-image"]}`}
            alt="Project Banner"
          />
        </div>
      </AnimatedSection>

      <div className="container mx-auto">
        {/* 描述區塊 - 從下方滑入 */}
        <AnimatedSection animation="fade-up" delay={0.1} className="py-4">
          <div className="flex justify-center bg-light py-6">
            <div className="col-md-10">
              <TrHtml
                id="textarea1"
                className="px-3 md:px-0 text-xl"
                html={data["t-planet-description"]}
              />
            </div>
          </div>
        </AnimatedSection>

        {/* 地圖 - 從下方滑入 */}
        <AnimatedSection animation="fade-up" delay={0.1} className="py-4">
          <div className="flex justify-center">
            <div className="w-full md:w-10/12">
              <div className="text-center">
                <img
                  id="t_planet_img"
                  className="img-fluid"
                  src={`${import.meta.env.VITE_HOST_URL_TPLANET}${data["t-planet-img"]}`}
                  alt="T Planet Map"
                />
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>

      <div className="bg-light py-4">
        <div className="container mx-auto">
          {/* CSR 卡片 - 從左滑入 */}
          <AnimatedSection animation="fade-left" className="flex justify-center">
            <div className="w-full md:w-10/12">
              <div className="card p-2 md:p-4">
                <div className="flex flex-col md:flex-row items-center">
                  <div className="w-full md:w-5/12 text-center">
                    <img
                      id="csr_img"
                      src={`${import.meta.env.VITE_HOST_URL_TPLANET}${data["csr-img"]}`}
                      className="img-fluid p-3 md:p-0"
                      alt="CSR"
                    />
                  </div>
                  <div className="w-full md:w-7/12">
                    <div className="card-body">
                      <TrHtml
                        id="textarea2"
                        className="card-text text-xl"
                        html={data["csr-description"]}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>

          {/* SDG 卡片 - 從右滑入 */}
          <AnimatedSection animation="fade-right" className="flex justify-center mt-5">
            <div className="w-full md:w-10/12">
              <div className="card p-2 md:p-4">
                <div className="flex flex-col md:flex-row items-center">
                  <div className="w-full md:w-5/12 text-center">
                    <img
                      id="sdg_img"
                      src={`${import.meta.env.VITE_HOST_URL_TPLANET}${data["sdg-img"]}`}
                      className="img-fluid p-3 md:p-0"
                      alt="SDGs"
                    />
                  </div>
                  <div className="w-full md:w-7/12">
                    <div className="card-body">
                      <TrHtml
                        id="textarea3"
                        className="card-text text-xl"
                        html={data["sdg-description"]}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>

          {/* Digital Twin 卡片 - 從左滑入 */}
          <AnimatedSection animation="fade-left" className="flex justify-center mt-5">
            <div className="w-full md:w-10/12">
              <div className="card p-2 md:p-4">
                <div className="flex flex-col md:flex-row items-center">
                  <div className="w-full md:w-5/12 text-center">
                    <img
                      id="twins_img"
                      src={`${import.meta.env.VITE_HOST_URL_TPLANET}${data["twins-img"]}`}
                      className="img-fluid p-3 md:p-0"
                      alt="Digital Twin"
                    />
                  </div>
                  <div className="w-full md:w-7/12">
                    <div className="card-body">
                      <TrHtml
                        id="textarea4"
                        className="card-text text-xl"
                        html={data["twins-description"]}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
};

export default Home;
