import React from "react";
import "./modal.scss";

import Backdrop from "./ModalBackdrop";
import SuccessModal from "./SuccessModal";
import ErrorModal from "./ErrorModal";


const modal = (props) => {
  let innerModalRender = null;
  if (props.status === "success") {
    innerModalRender = (
      <div className="modal-fade">
        <SuccessModal closeModal={props.closeModal} />
      </div>
    );
  }else if (props.status === "error") {
    innerModalRender = (
      <div className="modal-fade">
        <ErrorModal closeModal={props.closeModal} />
      </div>
    );
  }


  return (
    <div className="modal">
      <Backdrop closeModal={props.closeModal} />
      {innerModalRender}
    </div>
  );
};

export default modal;
