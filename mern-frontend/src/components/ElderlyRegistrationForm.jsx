// ElderlyRegistrationForm.jsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaBirthdayCake,
  FaPhone,
  FaHome,
  FaLeaf,
  FaBook,
  FaMusic,
  FaPaintBrush,
  FaHeart,
  FaCamera,
  FaGamepad,
  FaPuzzlePiece,
  FaHandsHelping,
  FaCar,
  FaUtensils,
  FaPills,
} from "react-icons/fa";

const ElderlyRegistrationForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    birthDate: "",
    phone: "",

    // Step 2: Address & Contact
    address: "",
    city: "",
    state: "",
    zipCode: "",
    emergencyContact: "",
    emergencyPhone: "",

    // Step 3: Hobbies & Interests
    hobbies: [],
    skillLevel: "beginner",
    availableTime: "morning",
    lookingFor: ["friends"],

    // Step 4: Help Needed
    helpNeeded: [],
    mobility: "independent",

    // Terms
    acceptTerms: false,
    acceptPrivacy: false,
  });

  const hobbyOptions = [
    {
      id: "gardening",
      name: "Gardening",
      icon: FaLeaf,
      color: "text-green-500",
    },
    { id: "reading", name: "Reading", icon: FaBook, color: "text-blue-500" },
    { id: "music", name: "Music", icon: FaMusic, color: "text-pink-500" },
    {
      id: "painting",
      name: "Painting/Drawing",
      icon: FaPaintBrush,
      color: "text-purple-500",
    },
    {
      id: "cooking",
      name: "Cooking/Baking",
      icon: FaUtensils,
      color: "text-yellow-500",
    },
    {
      id: "photography",
      name: "Photography",
      icon: FaCamera,
      color: "text-indigo-500",
    },
    {
      id: "crafts",
      name: "Crafts/Needlework",
      icon: FaPuzzlePiece,
      color: "text-orange-500",
    },
    {
      id: "games",
      name: "Board Games/Cards",
      icon: FaGamepad,
      color: "text-red-500",
    },
    {
      id: "volunteering",
      name: "Volunteering",
      icon: FaHandsHelping,
      color: "text-teal-500",
    },
  ];

  const helpOptions = [
    {
      id: "food",
      name: "Food Delivery",
      icon: FaUtensils,
      color: "text-yellow-400",
    },
    {
      id: "medicine",
      name: "Medicine Pickup",
      icon: FaPills,
      color: "text-red-400",
    },
    {
      id: "transport",
      name: "Transportation",
      icon: FaCar,
      color: "text-blue-400",
    },
    {
      id: "companionship",
      name: "Companionship",
      icon: FaHeart,
      color: "text-pink-400",
    },
    {
      id: "techhelp",
      name: "Tech Help",
      icon: FaGamepad,
      color: "text-purple-400",
    },
  ];

  const lookingForOptions = [
    {
      id: "friends",
      name: "Friendship",
      description: "Connect with others who share your interests",
    },
    {
      id: "learning",
      name: "Learning Partner",
      description: "Learn new skills together",
    },
    {
      id: "mentoring",
      name: "Mentoring",
      description: "Share your wisdom with others",
    },
    {
      id: "activity",
      name: "Activity Partner",
      description: "Do activities together",
    },
  ];

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      if (
        name === "hobbies" ||
        name === "helpNeeded" ||
        name === "lookingFor"
      ) {
        const updatedArray = checked
          ? [...formData[name], value]
          : formData[name].filter((item) => item !== value);
        setFormData({
          ...formData,
          [name]: updatedArray,
        });
      } else {
        setFormData({
          ...formData,
          [name]: checked,
        });
      }
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1);
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      window.scrollTo(0, 0);
    }
  };

 // In ElderlyRegistrationForm.jsx handleSubmit function:
const handleSubmit = async (e) => {
  e.preventDefault();
  
  // Validate passwords match
  if (formData.password !== formData.confirmPassword) {
    alert("Passwords do not match!");
    return;
  }
  
  // Prepare data for API
  const registrationData = {
    firstName: formData.firstName,
    lastName: formData.lastName,
    email: formData.email.toLowerCase(), // Ensure lowercase
    password: formData.password,
    birthDate: formData.birthDate,
    phone: formData.phone || "",
    address: formData.address || "",
    city: formData.city || "",
    state: formData.state || "",
    zipCode: formData.zipCode || "",
    emergencyContact: formData.emergencyContact || "",
    emergencyPhone: formData.emergencyPhone || "",
    hobbies: formData.hobbies || [],
    helpNeeded: formData.helpNeeded || [],
    mobility: formData.mobility || "independent",
    acceptTerms: formData.acceptTerms,
    acceptPrivacy: formData.acceptPrivacy
  };

  try {
    const res = await fetch("http://localhost:5000/api/elderly/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(registrationData),
    });

    const data = await res.json();
    console.log("Registration response:", data); // Debug log

    if (data.success) {
      alert(`Welcome ${formData.firstName}! Registration successful.`);
      navigate("/"); // Redirect to login page
    } else {
      alert(data.message || "Registration failed. Please try again.");
    }
  } catch (error) {
    console.error("Registration error:", error);
    alert("Server error during registration. Please try again.");
  }
};


  const renderStepIndicator = () => {
    const steps = [
      { number: 1, label: "Basic Info" },
      { number: 2, label: "Contact Info" },
      { number: 3, label: "Hobbies" },
      { number: 4, label: "Help Needs" },
      { number: 5, label: "Review" },
    ];

    return (
      <div className="mb-10">
        <div className="flex justify-between items-center mb-6">
          {steps.map((stepItem) => (
            <div key={stepItem.number} className="flex flex-col items-center">
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold mb-2
                ${
                  stepItem.number === step
                    ? "bg-blue-600 text-white border-4 border-blue-400"
                    : stepItem.number < step
                      ? "bg-green-600 text-white"
                      : "bg-gray-700 text-gray-300"
                }`}
              >
                {stepItem.number}
              </div>
              <span
                className={`text-lg font-medium ${stepItem.number === step ? "text-blue-300" : "text-gray-400"}`}
              >
                {stepItem.label}
              </span>
            </div>
          ))}
        </div>
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-teal-500 transition-all duration-500"
            style={{ width: `${(step - 1) * 25}%` }}
          ></div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center justify-center p-4 py-10">
      <div className="w-full max-w-6xl bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl overflow-hidden shadow-2xl border border-gray-700">
        <div className="p-8 md:p-10">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Join Our Elderly Community
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Create your account to connect with friends, share hobbies, and
              get help when you need it
            </p>
            <p className="text-gray-300 text-lg mt-6 text-center">
              Already have an account?
            </p>

            <button
              type="button"
              onClick={() => navigate("/")}
              className="
    mt-4
    px-10 py-3
    text-lg font-semibold
    bg-gradient-to-r from-blue-500 to-indigo-600
    text-white
    rounded-full
    shadow-lg
    hover:scale-105 hover:from-blue-600 hover:to-indigo-700
    transition-transform duration-300
  "
            >
              Already Registered? Login
            </button>
          </div>

          {renderStepIndicator()}

          <form onSubmit={handleSubmit}>
            {/* Step 1: Basic Information */}
            {step === 1 && (
              <div className="space-y-8">
                <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
                  <FaUser className="mr-3 text-blue-400" /> Basic Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-200 text-xl font-medium mb-3">
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="w-full p-4 text-xl bg-gray-700 border-2 border-gray-600 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/30 outline-none transition-all text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-200 text-xl font-medium mb-3">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="w-full p-4 text-xl bg-gray-700 border-2 border-gray-600 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/30 outline-none transition-all text-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-200 text-xl font-medium mb-3 flex items-center">
                    <FaEnvelope className="mr-2 text-blue-400" /> Email Address
                    *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full p-4 text-xl bg-gray-700 border-2 border-gray-600 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/30 outline-none transition-all text-white"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-200 text-xl font-medium mb-3 flex items-center">
                      <FaLock className="mr-2 text-blue-400" /> Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full p-4 pr-12 text-xl bg-gray-700 border-2 border-gray-600 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/30 outline-none transition-all text-white"
                        required
                      />
                      <button
                        type="button"
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-400"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <FaEyeSlash size={24} />
                        ) : (
                          <FaEye size={24} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-200 text-xl font-medium mb-3">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="w-full p-4 pr-12 text-xl bg-gray-700 border-2 border-gray-600 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/30 outline-none transition-all text-white"
                        required
                      />
                      <button
                        type="button"
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-400"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        {showConfirmPassword ? (
                          <FaEyeSlash size={24} />
                        ) : (
                          <FaEye size={24} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-200 text-xl font-medium mb-3 flex items-center">
                      <FaBirthdayCake className="mr-2 text-pink-400" /> Date of
                      Birth *
                    </label>
                    <input
                      type="date"
                      name="birthDate"
                      value={formData.birthDate}
                      onChange={handleChange}
                      className="w-full p-4 text-xl bg-gray-700 border-2 border-gray-600 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/30 outline-none transition-all text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-200 text-xl font-medium mb-3 flex items-center">
                      <FaPhone className="mr-2 text-green-400" /> Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full p-4 text-xl bg-gray-700 border-2 border-gray-600 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/30 outline-none transition-all text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Contact Information */}
            {step === 2 && (
              <div className="space-y-8">
                <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
                  <FaHome className="mr-3 text-green-400" /> Contact Information
                </h2>

                <div>
                  <label className="block text-gray-200 text-xl font-medium mb-3">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full p-4 text-xl bg-gray-700 border-2 border-gray-600 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/30 outline-none transition-all text-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-gray-200 text-xl font-medium mb-3">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full p-4 text-xl bg-gray-700 border-2 border-gray-600 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/30 outline-none transition-all text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-200 text-xl font-medium mb-3">
                      State
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      className="w-full p-4 text-xl bg-gray-700 border-2 border-gray-600 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/30 outline-none transition-all text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-200 text-xl font-medium mb-3">
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleChange}
                      className="w-full p-4 text-xl bg-gray-700 border-2 border-gray-600 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/30 outline-none transition-all text-white"
                    />
                  </div>
                </div>

                <div className="bg-blue-900/30 p-6 rounded-xl border border-blue-700">
                  <h3 className="text-2xl font-bold text-white mb-4">
                    Emergency Contact
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-gray-200 text-xl font-medium mb-3">
                        Contact Name
                      </label>
                      <input
                        type="text"
                        name="emergencyContact"
                        value={formData.emergencyContact}
                        onChange={handleChange}
                        className="w-full p-4 text-xl bg-gray-700 border-2 border-gray-600 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/30 outline-none transition-all text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-200 text-xl font-medium mb-3">
                        Emergency Phone
                      </label>
                      <input
                        type="tel"
                        name="emergencyPhone"
                        value={formData.emergencyPhone}
                        onChange={handleChange}
                        className="w-full p-4 text-xl bg-gray-700 border-2 border-gray-600 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/30 outline-none transition-all text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Hobbies & Interests */}
            {step === 3 && (
              <div className="space-y-8">
                <h2 className="text-3xl font-bold text-white mb-6">
                  Hobbies & Interests
                </h2>
                <p className="text-xl text-gray-300 mb-8">
                  Select your interests to connect with like-minded people in
                  our community
                </p>

                <div>
                  <h3 className="text-2xl font-bold text-white mb-6">
                    What are your hobbies? *
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {hobbyOptions.map((hobby) => {
                      const Icon = hobby.icon;
                      return (
                        <label
                          key={hobby.id}
                          className={`flex items-center p-4 rounded-xl cursor-pointer transition-all border-2
                            ${
                              formData.hobbies.includes(hobby.id)
                                ? "bg-blue-900/50 border-blue-500"
                                : "bg-gray-700 border-gray-600 hover:border-gray-500"
                            }`}
                        >
                          <input
                            type="checkbox"
                            name="hobbies"
                            value={hobby.id}
                            checked={formData.hobbies.includes(hobby.id)}
                            onChange={handleChange}
                            className="hidden"
                          />
                          <Icon className={`text-2xl mr-4 ${hobby.color}`} />
                          <span className="text-xl text-white">
                            {hobby.name}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-4">
                      Skill Level
                    </h3>
                    <div className="space-y-3">
                      {["beginner", "intermediate", "advanced"].map((level) => (
                        <label
                          key={level}
                          className="flex items-center cursor-pointer"
                        >
                          <input
                            type="radio"
                            name="skillLevel"
                            value={level}
                            checked={formData.skillLevel === level}
                            onChange={handleChange}
                            className="h-6 w-6 text-blue-500 mr-3"
                          />
                          <span className="text-xl text-gray-200 capitalize">
                            {level}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold text-white mb-4">
                      Preferred Time for Activities
                    </h3>
                    <select
                      name="availableTime"
                      value={formData.availableTime}
                      onChange={handleChange}
                      className="w-full p-4 text-xl bg-gray-700 border-2 border-gray-600 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/30 outline-none transition-all text-white"
                    >
                      <option value="morning">Morning (8AM - 12PM)</option>
                      <option value="afternoon">Afternoon (12PM - 4PM)</option>
                      <option value="evening">Evening (4PM - 8PM)</option>
                      <option value="flexible">Flexible</option>
                    </select>
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-white mb-6">
                    What are you looking for? *
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {lookingForOptions.map((option) => (
                      <label
                        key={option.id}
                        className={`flex items-start p-4 rounded-xl cursor-pointer transition-all border-2
                          ${
                            formData.lookingFor.includes(option.id)
                              ? "bg-green-900/30 border-green-500"
                              : "bg-gray-700 border-gray-600 hover:border-gray-500"
                          }`}
                      >
                        <input
                          type="checkbox"
                          name="lookingFor"
                          value={option.id}
                          checked={formData.lookingFor.includes(option.id)}
                          onChange={handleChange}
                          className="h-6 w-6 text-green-500 mr-3 mt-1"
                        />
                        <div>
                          <div className="text-xl font-bold text-white mb-1">
                            {option.name}
                          </div>
                          <div className="text-gray-300">
                            {option.description}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Help & Support Needs */}
            {step === 4 && (
              <div className="space-y-8">
                <h2 className="text-3xl font-bold text-white mb-6">
                  Help & Support Needs
                </h2>
                <p className="text-xl text-gray-300 mb-8">
                  Let us know how we can support you (optional)
                </p>

                <div>
                  <h3 className="text-2xl font-bold text-white mb-6">
                    What kind of help might you need?
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {helpOptions.map((help) => {
                      const Icon = help.icon;
                      return (
                        <label
                          key={help.id}
                          className={`flex items-center p-4 rounded-xl cursor-pointer transition-all border-2
                            ${
                              formData.helpNeeded.includes(help.id)
                                ? "bg-yellow-900/30 border-yellow-500"
                                : "bg-gray-700 border-gray-600 hover:border-gray-500"
                            }`}
                        >
                          <input
                            type="checkbox"
                            name="helpNeeded"
                            value={help.id}
                            checked={formData.helpNeeded.includes(help.id)}
                            onChange={handleChange}
                            className="hidden"
                          />
                          <Icon className={`text-2xl mr-4 ${help.color}`} />
                          <span className="text-xl text-white">
                            {help.name}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-white mb-4">
                    Mobility Level
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      {
                        id: "independent",
                        label: "Fully Independent",
                        desc: "No mobility assistance needed",
                      },
                      {
                        id: "some-assist",
                        label: "Some Assistance",
                        desc: "Occasional help with mobility",
                      },
                      {
                        id: "wheelchair",
                        label: "Wheelchair User",
                        desc: "Uses wheelchair for mobility",
                      },
                    ].map((level) => (
                      <label
                        key={level.id}
                        className={`p-4 rounded-xl cursor-pointer transition-all border-2 text-center
                          ${
                            formData.mobility === level.id
                              ? "bg-purple-900/30 border-purple-500"
                              : "bg-gray-700 border-gray-600 hover:border-gray-500"
                          }`}
                      >
                        <input
                          type="radio"
                          name="mobility"
                          value={level.id}
                          checked={formData.mobility === level.id}
                          onChange={handleChange}
                          className="hidden"
                        />
                        <div className="text-xl font-bold text-white mb-2">
                          {level.label}
                        </div>
                        <div className="text-gray-300 text-sm">
                          {level.desc}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-900/30 to-teal-900/30 p-6 rounded-xl border border-blue-700">
                  <h3 className="text-2xl font-bold text-white mb-4">
                    Safety & Privacy
                  </h3>
                  <p className="text-gray-300 mb-4 text-lg">
                    Your safety is our priority. All personal information is
                    encrypted and only shared with authorized volunteers when
                    you request help.
                  </p>
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      name="acceptPrivacy"
                      checked={formData.acceptPrivacy}
                      onChange={handleChange}
                      className="h-7 w-7 text-blue-500 mr-3 mt-1"
                    />
                    <label className="text-gray-200 text-lg">
                      I understand how my data will be used and agree to the
                      privacy policy
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Review & Submit */}
            {step === 5 && (
              <div className="space-y-8">
                <h2 className="text-3xl font-bold text-white mb-6">
                  Review Your Information
                </h2>

                <div className="bg-gray-700/50 rounded-xl p-6 border border-gray-600">
                  <h3 className="text-2xl font-bold text-white mb-4 flex items-center">
                    <FaUser className="mr-3 text-blue-400" /> Personal
                    Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-gray-400 text-lg">Name</p>
                      <p className="text-white text-xl font-medium">
                        {formData.firstName} {formData.lastName}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-lg">Email</p>
                      <p className="text-white text-xl font-medium">
                        {formData.email}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-lg">Phone</p>
                      <p className="text-white text-xl font-medium">
                        {formData.phone || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-lg">Location</p>
                      <p className="text-white text-xl font-medium">
                        {formData.city
                          ? `${formData.city}, ${formData.state}`
                          : "Not provided"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-700/50 rounded-xl p-6 border border-gray-600">
                  <h3 className="text-2xl font-bold text-white mb-4">
                    Hobbies & Interests
                  </h3>
                  <div className="flex flex-wrap gap-3 mb-4">
                    {formData.hobbies.map((hobbyId) => {
                      const hobby = hobbyOptions.find((h) => h.id === hobbyId);
                      const Icon = hobby?.icon;
                      return (
                        <span
                          key={hobbyId}
                          className="bg-blue-800/50 px-4 py-2 rounded-lg flex items-center"
                        >
                          {Icon && <Icon className={`mr-2 ${hobby.color}`} />}
                          <span className="text-white text-lg">
                            {hobby?.name}
                          </span>
                        </span>
                      );
                    })}
                  </div>
                  <p className="text-gray-300 text-lg">
                    <span className="font-medium">Skill Level:</span>{" "}
                    {formData.skillLevel}
                  </p>
                </div>

                {formData.helpNeeded.length > 0 && (
                  <div className="bg-gray-700/50 rounded-xl p-6 border border-gray-600">
                    <h3 className="text-2xl font-bold text-white mb-4">
                      Help Requested
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {formData.helpNeeded.map((helpId) => {
                        const help = helpOptions.find((h) => h.id === helpId);
                        const Icon = help?.icon;
                        return (
                          <span
                            key={helpId}
                            className="bg-yellow-800/50 px-4 py-2 rounded-lg flex items-center"
                          >
                            {Icon && <Icon className={`mr-2 ${help.color}`} />}
                            <span className="text-white text-lg">
                              {help?.name}
                            </span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="bg-gradient-to-r from-emerald-900/30 to-green-900/30 p-6 rounded-xl border border-emerald-700">
                  <h3 className="text-2xl font-bold text-white mb-4">
                    Terms & Conditions
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <input
                        type="checkbox"
                        name="acceptTerms"
                        checked={formData.acceptTerms}
                        onChange={handleChange}
                        className="h-7 w-7 text-green-500 mr-3 mt-1"
                        required
                      />
                      <label className="text-gray-200 text-lg">
                        I agree to the Terms of Service and Community Guidelines
                      </label>
                    </div>
                    <div className="text-gray-300 text-lg">
                      By creating an account, you agree to be respectful, kind,
                      and supportive to all community members.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-12 pt-8 border-t border-gray-700">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-8 py-4 text-xl font-medium bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-colors border border-gray-600"
                >
                  ← Back
                </button>
              ) : (
                <div></div>
              )}

              {step < 5 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-10 py-4 text-xl font-medium bg-gradient-to-r from-blue-600 to-teal-500 text-white rounded-xl hover:opacity-90 transition-all shadow-lg"
                >
                  Next Step →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!formData.acceptTerms}
                  className={`px-10 py-4 text-xl font-medium rounded-xl transition-all shadow-lg
                    ${
                      formData.acceptTerms
                        ? "bg-gradient-to-r from-green-600 to-emerald-500 text-white hover:opacity-90"
                        : "bg-gray-700 text-gray-400 cursor-not-allowed"
                    }`}
                >
                  Create My Account
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      <footer className="mt-8 text-center text-gray-400">
        <p className="text-lg">
          © 2023 Eldercare Community. Creating meaningful connections for
          seniors.
        </p>
        <p className="text-gray-500 mt-2">
          Need help? Call our support line: 1-800-ELDER-CARE
        </p>
      </footer>
    </div>
  );
};

export default ElderlyRegistrationForm;
