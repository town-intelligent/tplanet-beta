import { useState, useEffect } from "react";
import Add from "../../assets/add.svg";
import Upload from "../../assets/add-file-Icon.svg";
import ProjectList from "./components/ProjectList";
import { list_plans, plan_info, plan_submit } from "../../utils/Plan";
import { Form, Modal, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import { useTranslation } from "react-i18next";


function Dropzone() {
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const { acceptedFiles, getRootProps, getInputProps } = useDropzone({
    accept: {
      "application/pdf": [],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [],
      "application/msword": [],
    },
  });

  const files = acceptedFiles.map((file) => (
    <div className="flex justify-center">
      <p className="text-sm font-medium text-gray-900 truncate m-0">
        {file.name}({formatFileSize(file.size)})
      </p>
    </div>
  ));

  return (
    <section className="container">
      <div
        {...getRootProps({ className: "dropzone" })}
        className=" py-8 border shadow border-gray-300 rounded-lg bg-white hover:bg-gray-100 cursor-pointer w-full transition-colors"
      >
        <input {...getInputProps()} />
        {acceptedFiles.length > 0 ? (
          <div>{files}</div>
        ) : (
          <div className="flex flex-col items-center justify-center ">
            <img src={Upload} alt="上傳檔案" className="w-10 h-10 mb-2" />
            <p>請上傳 PDF或WORD 格式</p>
          </div>
        )}
      </div>

      {/* {files.length > 0 && (
        <aside className="mt-4 max-w-[340px] overflow-auto">
          <p className="font-medium text-gray-700 mb-2">
            已上傳檔案 ({files.length})
          </p>
          <div className="space-y-2 overflow-hidden">
            {files.map((fileItem) => (
              <div
                key={fileItem.id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {fileItem.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </aside>
      )} */}
    </section>
  );
}

export default function CmsAgent() {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [years, setYears] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleAddProject = async (event) => {
    event.preventDefault();

    const form = new FormData();
    const obj_project = await plan_submit(form);

    if (obj_project?.uuid) {
      navigate(`/backend/cms_plan_info/${obj_project.uuid}`);
    } else {
      console.error("[CmsAgent] 新增專案失敗：未取得 uuid", obj_project);
      alert("新增專案失敗，請稍後再試");
    }
  };

  const fetchProjects = async () => {
    try {
      const hoster = localStorage.getItem("email");

      const allProjects = [];
      const projectYears = new Set();
      const projectLocations = new Set();

      // show debug info
      const objListProjects = await list_plans(hoster, null);
      //setObjListProjects(objListProjects);
      for (const uuid of objListProjects.projects) {
        const projectInfo = await plan_info(uuid);
        allProjects.push({ uuid, ...projectInfo });

        if (projectInfo.period) {
          const startYear = new Date(
            projectInfo.period.split("-")[0]
          ).getFullYear();
          if (!isNaN(startYear)) {
            projectYears.add(startYear);
          }
        }
        if (projectInfo.location) {
          const locationArray = projectInfo.location.split(",");
          locationArray.forEach((location) => projectLocations.add(location));
        }
      }

      setProjects(allProjects);
      setFilteredProjects(allProjects);
      setYears(Array.from(projectYears).sort());
      setLocations(Array.from(projectLocations).sort());
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const applyFilters = (year, location) => {
    let filtered = projects;

    // 年度篩選
    if (year !== "all") {
      filtered = filtered.filter((project) => {
        if (!project.period) return false;
        const startYear = new Date(project.period.split("-")[0]).getFullYear();
        return startYear === parseInt(year);
      });
    }

    // 地區篩選
    if (location !== "all") {
      filtered = filtered.filter((project) => {
        if (!project.location) return false;
        const locationArray = project.location.split(",");
        return locationArray.includes(location);
      });
    }

    setFilteredProjects(filtered);
  };

  const handleYearChange = (e) => {
    const year = e.target.value;
    setSelectedYear(year);
    applyFilters(year, selectedLocation);
  };

  const handleLocationChange = (e) => {
    const location = e.target.value;
    setSelectedLocation(location);
    applyFilters(selectedYear, location);
  };

  // const handleUpload = () => {
  //   setShowModal(true);
  // };
  return (
    <section>
      <div className="container">
        <div className="row mt-md-5 mb-4 align-items-center ">
          <div className="flex items-center bg-[#317EE0]">
            <div className="col-md-8 d-none d-md-block ">
              <p className="px-5 py-3 m-0 text-white text-2xl">{t("cmsagent.title")}</p>
            </div>
            <div className="flex gap-2 w-full">
              <div className="w-1/3">
                <Form.Select
                  id="year_filter"
                  value={selectedYear}
                  onChange={handleYearChange}
                >
                  <option value="all">{t("cmsagent.year")}</option>
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </Form.Select>
              </div>
              <div className="w-2/3">
                <Form.Select
                  aria-label="選擇行政區域"
                  value={selectedLocation}
                  onChange={handleLocationChange}
                >
                  <option value="all">{t("cmsagent.location_select")}</option>
                  {locations.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </Form.Select>
              </div>
            </div>
          </div>

          <div className="flex gap-10 justify-between mt-4 items-center">
            <button
              id="add_c_project"
              onClick={handleAddProject}
              className="border py-3 w-full d-flex alitems-center justify-content-center"
              style={{ boxShadow: "0px 4px 4px 0px rgba(0, 0, 0, 0.25)" }}
            >
              {t("cmsagent.add_project")}
              <img src={Add} alt={t("cmsagent.add_project")} className="mr-2 w-4" />
            </button>
            {/* <button
              id="add_c_project"
              onClick={handleUpload}
              className="bg-[#EE7A52] text-white px-3 h-10 rounded"
            >
              AI辨識縣府計畫
            </button> */}
          </div>
        </div>

        <Modal
          size="md"
          show={showModal}
          onHide={() => {
            setShowModal(false);
          }}
          centered
        >
          <Modal.Header closeButton className="border-0 flex items-center">
            <div className="flex-1 text-center font-bold text-xl">{t("cmsagent.modal_add_file")}</div>
          </Modal.Header>

          <Modal.Body>
            <div className="flex flex-col gap-5 justify-center items-center">
              <Dropzone />
              {/* <button className="w-full">
                <div className="d-flex justify-content-center align-items-center h-100 border py-3">
                  <div className="text-center">
                    <img
                      src={Upload}
                      alt=""
                      className="mx-auto d-block w-[50px]"
                    />
                    <p className="mt-2 mb-0">請上傳 PDF或WORD 格式</p>
                  </div>
                </div>
              </button> */}
              <Button variant="dark" className="w-32">
                {t("cmsagent.modal_add")}
              </Button>
            </div>
          </Modal.Body>
        </Modal>

        <div id="project_list" className="row">
          <ProjectList filteredProjects={filteredProjects} />
        </div>
      </div>
    </section>
  );
}
