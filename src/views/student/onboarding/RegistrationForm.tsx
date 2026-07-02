import React, { useState } from "react";
import { AVATARS } from "../../../utils/constants";
import { ChunkyButton } from "../../../components/ChunkyButton";

export interface RegistrationData {
  name: string;
  age: string;
  studentClass: string;
  phone: string;
  selectedAvatar: string;
}

interface RegistrationFormProps {
  onSubmit: (data: RegistrationData) => void;
  setErrorMsg: (msg: string) => void;
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({ onSubmit, setErrorMsg }) => {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("bear");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("Please tell us your name! 😊");
      return;
    }
    if (!phone.trim()) {
      setErrorMsg("Please tell us your parent's phone number! 📱");
      return;
    }
    setErrorMsg("");
    onSubmit({
      name: name.trim(),
      age: age.trim(),
      studentClass: studentClass.trim(),
      phone: phone.trim(),
      selectedAvatar
    });
  };

  return (
    <form onSubmit={handleSubmit} className="onboarding-form">
      {/* Name Input */}
      <div className="form-group">
        <label htmlFor="student-name-input" className="form-label">
          What is your name?
        </label>
        <input
          id="student-name-input"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Type your name here..."
          maxLength={20}
          className="form-input"
        />
      </div>

      {/* Age Input Dropdown */}
      <div className="form-group">
        <label htmlFor="student-age-input" className="form-label">
          How old are you? (Optional)
        </label>
        <select
          id="student-age-input"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          className="form-select"
        >
          <option value="">Select age... 🎂</option>
          <option value="3">3 Years Old</option>
          <option value="4">4 Years Old</option>
          <option value="5">5 Years Old</option>
          <option value="6">6 Years Old</option>
          <option value="7">7 Years Old</option>
          <option value="8">8 Years Old</option>
          <option value="9">9 Years Old</option>
          <option value="10">10 Years Old</option>
          <option value="11">11 Years Old</option>
          <option value="12">12 Years Old</option>
        </select>
      </div>

      {/* Class Input Dropdown */}
      <div className="form-group">
        <label htmlFor="student-class-input" className="form-label">
          What class are you in? (Optional)
        </label>
        <select
          id="student-class-input"
          value={studentClass}
          onChange={(e) => setStudentClass(e.target.value)}
          className="form-select"
        >
          <option value="">Select class ... 🏫</option>
          <option value="Preschool">Preschool 🧸</option>
          <option value="Kindergarten">Kindergarten 🎒</option>
          <option value="Grade 1">Grade 1 ✏️</option>
          <option value="Grade 2">Grade 2 📚</option>
          <option value="Grade 3">Grade 3 🧠</option>
          <option value="Grade 4">Grade 4 🌌</option>
          <option value="Grade 5">Grade 5 🚀</option>
          <option value="Grade 6">Grade 6 🪐</option>
          <option value="Grade 7">Grade 7 🛸</option>
        </select>
      </div>

      {/* Phone No Input */}
      <div className="form-group">
        <label htmlFor="student-phone-input" className="form-label">
          Parent's Phone Number
        </label>
        <input
          id="student-phone-input"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Type phone number here..."
          maxLength={15}
          className="form-input"
        />
      </div>

      {/* Avatar Selector */}
      <div className="avatar-selector-container">
        <span className="form-label">
          Choose your Avatar:
        </span>
        <div className="avatar-grid">
          {AVATARS.map(avatar => (
            <button
              key={avatar.id}
              type="button"
              onClick={() => setSelectedAvatar(avatar.id)}
              className={`avatar-btn ${selectedAvatar === avatar.id ? "active" : ""}`}
              style={{
                backgroundColor: selectedAvatar === avatar.id ? avatar.color : "transparent"
              }}
              title={avatar.label}
            >
              {avatar.label.split(" ")[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Submit */}
      <ChunkyButton type="submit" variant="primary" className="onboarding-submit-btn">
        Start Learning
      </ChunkyButton>
    </form>
  );
};
