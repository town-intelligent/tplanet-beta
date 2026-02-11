import { useState, useMemo, useEffect } from "react";
import { Container, Button, Modal } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import Update from "../../../assets/update-project.svg";
import Delete from "../../../assets/del-project.svg";
import SROI from "../../../assets/menu-sroi.svg";
import { plan_delete } from "../../../utils/Plan";
import { useTranslation } from "react-i18next";

const ProjectList = ({ filteredProjects }) => {
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const { t } = useTranslation();

  const handleManage = (project) => {
    setSelectedProject(project);
    setShowModal(true);
  };

  const handleDelete = async () => {
    const result = await plan_delete(selectedProject?.uuid);
    if (result.result === true) {
      setShowDeleteModal(false);
      alert("刪除成功");
      window.location.reload();
    } else {
      setShowDeleteModal(false);
      alert("刪除失敗");
    }
  };

  // 分頁
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProjects.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProjects, currentPage]);
  
    const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);

  // 篩選變更時，回到第 1 頁並捲到最上
  useEffect(() => {
    setCurrentPage(1);
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [filteredProjects]);

  const handlePageChange = (p) => {
    if (p === currentPage) return;
    setCurrentPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderPaginationButtons = () => {
    const btns = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);

    btns.push(
      <button key="prev" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}
        className="px-3 py-1 mx-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
          {t("accountList.prev_page")}
      </button>
    );
    if (start > 1) {
      btns.push(
        <button key={1} onClick={() => handlePageChange(1)} className="px-3 py-1 mx-1 border border-gray-300 rounded hover:bg-gray-50">1</button>
      );
      if (start > 2) btns.push(<span key="e1" className="px-2">...</span>);
    }
    for (let p = start; p <= end; p++) {
      btns.push(
        <button key={p} onClick={() => handlePageChange(p)}
          className={`px-3 py-1 mx-1 border rounded ${currentPage === p ? "bg-blue-500 text-white border-blue-500" : "border-gray-300 hover:bg-gray-50"}`}>
          {p}
        </button>
      );
    }
    if (end < totalPages) {
      if (end < totalPages - 1) btns.push(<span key="e2" className="px-2">...</span>);
      btns.push(
        <button key={totalPages} onClick={() => handlePageChange(totalPages)}
          className="px-3 py-1 mx-1 border border-gray-300 rounded hover:bg-gray-50">
          {totalPages}
        </button>
      );
    }
    btns.push(
      <button key="next" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}
        className="px-3 py-1 mx-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
        {t("accountList.next_page")}
      </button>
    );
    return btns;
  };

  return (
    <Container className="py-4">
      <table className="w-full">
        <thead className="bg-[#4472C4] text-white sticky top-0 z-10">
          <tr>
            <th className="p-3 text-center w-[80px]">{t("cmsagent.column_id")}</th>
            <th className="p-3 text-center">{t("cmsagent.column_name")}</th>
            <th className="p-3 text-center">{t("cmsagent.column_period")}</th>
            <th className="p-3 text-center">{t("cmsagent.column_budget")}</th>
            <th className="p-3 text-center"></th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-200">
          {filteredProjects.length === 0 ? (
            <tr>
              <td colSpan="5" className="text-center py-8 text-gray-500">
                {t("cmsagent.no_data")}
              </td>
            </tr>
          ) : (
            paginatedData.map((project, index) => (
              <tr
                key={project.uuid}
                onClick={() => navigate(`/content/${project.uuid}`)}
                className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"} group hover:!bg-blue-100 cursor-pointer`}
              >
                <td className="p-4 text-center">
                  {project.uuid}
                </td>

                <td className="p-4">
                  {project.name}
                </td>

                <td className="p-4 text-center">
                  {project.period}
                </td>

                <td className="p-4 text-center">
                  {project.budget}
                </td>

                <td className="p-4">
                  <div className="flex justify-center relative z-10">
                    <Button
                      variant="dark"
                      className="mt-auto rounded-pill w-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleManage(project);
                      }}
                    >
                      {t("cmsagent.manage_menu")}
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      {filteredProjects.length > 0 && (
        <div className="mt-4 flex items-center justify-between px-4">
          <div className="text-sm text-gray-700">
             {t("accountList.showing")} {(currentPage - 1) * itemsPerPage + 1} {t("accountList.to")} {Math.min(currentPage * itemsPerPage, filteredProjects.length)} {t("accountList.of")} {filteredProjects.length} {t("accountList.items")}
          </div>
          {totalPages > 1 && <div className="flex items-center">{renderPaginationButtons()}</div>}
        </div>
      )}

      {/* 管理選單 Modal */}
      <Modal
        size="lg"
        show={showModal}
        onHide={() => {
          setShowModal(false);
          setSelectedProject(null);
        }}
        centered
      >
        <Modal.Header closeButton className="border-0 flex items-center">
          <div className="flex-1 text-center font-bold text-xl">
            {t("cmsagent.modal_manage_title")}
          </div>
        </Modal.Header>

        <Modal.Body>
          <div className="container my-4">
            <div className="row justify-content-center">
              <div className="col-md-10 d-none d-md-block">
                <div className="row justify-content-center">
                  <div className="col-2">
                    <div
                      className="card card-button"
                      style={{ height: "100px" }}
                    >
                      <div className="d-flex justify-content-center align-items-center h-100">
                        <div className="text-center">
                          <img
                            src={Update}
                            alt=""
                            className="mx-auto d-block w-[50px]"
                          />
                          <p className="mt-2 mb-0">{t("cmsagent.update_project")}</p>
                        </div>
                      </div>
                      {selectedProject?.uuid && (
                        <Link
                          to={`/backend/cms_plan_info/${selectedProject.uuid}`}
                          className="stretched-link"
                        ></Link>
                      )}
                    </div>
                  </div>
                  {/* <div className="col-2">
                    <div
                      className="card card-button"
                      style={{ height: "100px" }}
                    >
                      <div className="d-flex justify-content-center align-items-center h-100">
                        <div className="text-center">
                          <img
                            src={HotZone}
                            alt=""
                            className="mx-auto d-block w-[50px]"
                          />
                          <p className="mt-2 mb-0">熱區圖示</p>
                        </div>
                      </div>
                      <Link
                        to={`/backend/heat_map/${selectedProject?.uuid}`}
                        className="stretched-link"
                      ></Link>
                    </div>
                  </div> */}
                  <div className="col-2">
                    <div
                      className="card card-button"
                      style={{ height: "100px" }}
                    >
                      <div className="d-flex justify-content-center align-items-center h-100">
                        <div className="text-center">
                          <img
                            src={SROI}
                            alt=""
                            className="mx-auto d-block w-[50px]"
                          />
                          <p className="mt-2 mb-0">SROI</p>
                        </div>
                      </div>
                      {selectedProject?.uuid && (
                        <Link
                          to={`/backend/cms_sroi/${selectedProject.uuid}`}
                          className="stretched-link"
                        ></Link>
                      )}
                    </div>
                  </div>
                  <div className="col-2">
                    <div
                      className="card card-button"
                      style={{ height: "100px" }}
                    >
                      <div className="d-flex justify-content-center align-items-center h-100">
                        <div className="text-center">
                          <img
                            src={Delete}
                            alt=""
                            className="mx-auto d-block w-[36px]"
                          />
                          <p className="mt-2 mb-0">{t("cmsagent.delete_project")}</p>
                        </div>
                      </div>
                      <button
                        className="stretched-link"
                        onClick={() => {
                          setShowModal(false);
                          setShowDeleteModal(true);
                        }}
                      ></button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-12 d-md-none">
                <div className="row">
                  <div className="col-6 mt-4">
                    <div
                      className="card card-button"
                      style={{ height: "120px" }}
                    >
                      <div className="d-flex justify-content-center align-items-center h-100">
                        <div className="text-center">
                          <img
                            src={Update}
                            alt=""
                            className="mx-auto d-block w-[50px]"
                          />
                          <p className="mt-2 mb-0">{t("cmsagent.update_project")}</p>
                        </div>
                      </div>
                      {selectedProject?.uuid && (
                        <Link
                          to={`/backend/cms_plan_info/${selectedProject.uuid}`}
                          className="stretched-link"
                        ></Link>
                      )}
                    </div>
                  </div>
                  {/* <div className="col-6 mt-4">
                    <div
                      className="card card-button"
                      style={{ height: "120px" }}
                    >
                      <div className="d-flex justify-content-center align-items-center h-100">
                        <div className="text-center">
                          <img
                            src={HotZone}
                            alt=""
                            className="mx-auto d-block w-[50px]"
                          />
                          <p className="mt-2 mb-0">熱區圖示</p>
                        </div>
                      </div>
                      <Link
                        to={`/backend/heat_map/${selectedProject?.uuid}`}
                        className="stretched-link"
                      ></Link>
                    </div>
                  </div> */}
                  <div className="col-6 mt-4">
                    <div
                      className="card card-button"
                      style={{ height: "120px" }}
                    >
                      <div className="d-flex justify-content-center align-items-center h-100">
                        <div className="text-center">
                          <img
                            src={SROI}
                            alt=""
                            className="mx-auto d-block w-[50px]"
                          />
                          <p className="mt-2 mb-0">SROI</p>
                        </div>
                      </div>
                      {selectedProject?.uuid && (
                        <Link
                          to={`/backend/cms_sroi/${selectedProject.uuid}`}
                          className="stretched-link"
                        ></Link>
                      )}
                    </div>
                  </div>
                  <div className="col-6 mt-4">
                    <div
                      className="card card-button"
                      style={{ height: "120px" }}
                    >
                      <div className="d-flex justify-content-center align-items-center h-100">
                        <div className="text-center">
                          <img
                            src={Delete}
                            alt=""
                            className="mx-auto d-block w-[50px]"
                          />
                          <p className="mt-2 mb-0">{t("cmsagent.delete_project")}</p>
                        </div>
                      </div>
                      <button
                        className="stretched-link"
                        onClick={() => {
                          setShowDeleteModal(true);
                          setShowModal(false);
                        }}
                      ></button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Modal.Body>
      </Modal>

      {/* 刪除確認 Modal */}
      <Modal
        show={showDeleteModal}
        onHide={() => {
          setShowDeleteModal(false);
          setSelectedProject(null);
        }}
        centered
        size="sm"
      >
        <Modal.Body>
          <p className="text-center text-lg">{t("cmsagent.confirm_delete_project")}</p>
          <div className="flex justify-center gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedProject(null);
              }}
            >
              {t("cmsagent.cancel")}
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              {t("cmsagent.confirm_delete")}
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default ProjectList;