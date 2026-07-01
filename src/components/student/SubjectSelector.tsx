import React from "react";
import { PlayCard } from "../PlayCard";
import { SUBJECTS } from "../../utils/constants";

interface SubjectSelectorProps {
  selectedSubject: string;
  setSelectedSubject: (id: string) => void;
}

export const SubjectSelector: React.FC<SubjectSelectorProps> = ({
  selectedSubject,
  setSelectedSubject
}) => {
  const enabledSubjects = SUBJECTS.filter(s => s.enabled);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${enabledSubjects.length}, 1fr)`,
        gap: "12px",
        marginBottom: "24px"
      }}
    >
      {enabledSubjects.map(subject => (
        <PlayCard
          key={subject.id}
          onClick={() => setSelectedSubject(subject.id)}
          style={{
            backgroundColor: subject.color,
            borderColor: selectedSubject === subject.id ? "var(--text-primary)" : subject.border,
            borderWidth: "3px",
            borderStyle: selectedSubject === subject.id ? "solid" : "dashed",
            cursor: "pointer",
            padding: "16px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "6px"
          }}
        >
          <span style={{ fontSize: "1.1rem", fontWeight: "800", color: "#1e293b" }}>
            {subject.title}
          </span>
        </PlayCard>
      ))}
    </div>
  );
};

export default SubjectSelector;
