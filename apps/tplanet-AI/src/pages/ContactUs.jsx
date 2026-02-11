import React, { useEffect, useState } from "react";
import { mockup_get } from "../utils/Mockup.jsx";
import SdgsModal from "./backend/components/SdgSelect.jsx";
import Banner from "../assets/contact-us-banner.png";
import { Form, Button } from "react-bootstrap";
import SliderCaptchaComponent from "../utils/Captcha.jsx";
import { useHosters, useDepartments } from "../utils/multi-tenant";
import { useTranslation } from "react-i18next";
import { AnimatedSection } from "../utils/useScrollAnimation";

export default function ContactUsPage() {
  const { t } = useTranslation();
  const hosters = useHosters();
  const departments = useDepartments();
  const [bannerUrl, setBannerUrl] = useState(null);
  const [isVerified, setIsVerified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSDGs, setSelectedSDGs] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    department: "",
    phone: "",
    sdgs: [],
    needs: "",
  });

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      sdgs: selectedSDGs,
    }));
  }, [selectedSDGs]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async () => {
    if (!isVerified) {
      alert(t("contactus.please_verify"));
      return;
    }
    if (!formData.name || !formData.email || !formData.needs) {
      alert(t("contactus.required_fields"));
      return;
    }

    setIsSubmitting(true);
    try {
      const API_BASE = import.meta.env.VITE_HOST_URL_TPLANET;
      const form = new FormData();
      form.append("name", formData.name);
      form.append("email", formData.email);
      form.append("company", formData.company);
      form.append("phone", formData.phone);
      form.append("sdgs", formData.sdgs.join(", "));
      form.append("needs", formData.needs);
      if (hosters.length) form.append("to", hosters[0]);

      const res = await fetch(`${API_BASE}/api/portal/contact_us`, {
        method: "POST",
        body: form,
      });
      const data = await res.json();

      if (data.result) {
        alert(t("contactus.send_success"));
        setFormData({ name: "", email: "", company: "", department: "", phone: "", sdgs: [], needs: "" });
        setSelectedSDGs([]);
        setIsVerified(false);
      } else {
        alert(t("contactus.send_fail"));
      }
    } catch (e) {
      console.error("contact_us error:", e);
      alert(t("contactus.send_fail"));
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!hosters.length) return;

    const fetchData = async () => {
      // mockup 取得 banner
      const form = new FormData();
      form.append("email", hosters[0]);
      const obj_mockup = await mockup_get(form);

      try {
        if (obj_mockup.description?.["contact-us-banner-img"]) {
          const imgPath = obj_mockup.description["contact-us-banner-img"];
          setBannerUrl(import.meta.env.VITE_HOST_URL_TPLANET + imgPath);
        }
      } catch (e) {
        console.log(e);
      }
    };

    fetchData();
  }, [hosters]);

  return (
    <div className="overflow-hidden">
      {/* Banner - 淡入放大 */}
      <AnimatedSection animation="zoom-in">
        <div
          id="contact_us_banner_1"
          style={{
            backgroundImage: `url(${bannerUrl || Banner})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            height: "200px",
          }}
        />
      </AnimatedSection>

      <Form className="w-5/6 mx-auto py-10">
        {/* 表單左右欄位 */}
        <div className="flex justify-between" style={{ position: "relative", zIndex: 10 }}>
          {/* 左側欄位 - 從左滑入 */}
          <AnimatedSection animation="fade-left" className="col-md-5">
            <Form.Group className="mb-3" controlId="exampleForm.ControlInput1">
              <Form.Label>{t("contactus.name")}</Form.Label>
              <Form.Control
                type="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="exampleForm.ControlInput1">
              <Form.Label>{t("contactus.company")}</Form.Label>
              <Form.Control
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="exampleForm.ControlInput1">
              <Form.Label>{t("contactus.phone")}</Form.Label>
              <Form.Control
                type="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </Form.Group>
          </AnimatedSection>

          {/* 右側欄位 - 從右滑入 */}
          <AnimatedSection animation="fade-right" className="col-md-5">
            <Form.Group className="mb-3" controlId="exampleForm.ControlInput1">
              <Form.Label>{t("contactus.email")}</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="exampleForm.ControlInput1">
              <Form.Label>{t("contactus.topics")}</Form.Label>
              <SdgsModal
                selectedSDGs={selectedSDGs}
                setSelectedSDGs={setSelectedSDGs}
              />
            </Form.Group>
          </AnimatedSection>
        </div>

        {/* 需求說明 - 從下滑入 */}
        <AnimatedSection animation="fade-up" delay={0.1}>
          <Form.Group className="mb-3" controlId="exampleForm.ControlTextarea1">
            <Form.Label>{t("contactus.needs")}</Form.Label>
            <Form.Control
              as="textarea"
              name="needs"
              rows={3}
              value={formData.needs}
              onChange={handleChange}
              required
            />
          </Form.Group>
        </AnimatedSection>

        {/* 驗證碼與送出按鈕 - 從下滑入 */}
        <AnimatedSection animation="fade-up" delay={0.2}>
          <div className="flex justify-center">
            <SliderCaptchaComponent
              isVerified={isVerified}
              setIsVerified={setIsVerified}
            />
          </div>
          <div className="flex justify-center">
            <Button variant="secondary" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? t("contactus.sending") : t("contactus.submit")}
            </Button>
          </div>
        </AnimatedSection>
      </Form>
    </div>
  );
}
