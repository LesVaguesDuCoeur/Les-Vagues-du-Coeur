import React from 'react';
import PersonalDetailsForm from './PersonalDetailsForm';
import ExperienceForm from './ExperienceForm';
import SkillsForm from './SkillsForm';
import EducationForm from './EducationForm';
import LanguagesForm from './LanguagesForm';
import InterestsForm from './InterestsForm';

const EditorLayout = () => {
  return (
    <div className="space-y-6 pb-20">
      <PersonalDetailsForm />
      <ExperienceForm />
      <SkillsForm />
      <EducationForm />
      <LanguagesForm />
      <InterestsForm />
    </div>
  );
};

export default EditorLayout;
