import React from "react";

interface Props {
  onOpen: () => void;
}

const BottomReportButton: React.FC<Props> = ({ onOpen }) => {
  return (
    <button
      className="bottom-report-button"
      onClick={onOpen}
      aria-label="Report Incident"
    >
      Report
    </button>
  );
};

export default BottomReportButton;
