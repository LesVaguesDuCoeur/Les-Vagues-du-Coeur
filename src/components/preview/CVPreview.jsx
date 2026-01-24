import React from 'react';
import { useCV } from '../../store/cvStore';
import { Mail, Phone, MapPin, Linkedin } from 'lucide-react';

const CVPreview = () => {
  const { state } = useCV();
  const { personalInfo, experiences, skills, education, languages, interests } = state;

  return (
    <div className="bg-white shadow-2xl w-full max-w-[210mm] min-h-[297mm] p-8 mx-auto" id="cv-preview">
      {/* Header */}
      <div className="flex gap-6 mb-6">
        {personalInfo.photo && (
            <div className="w-32 h-32 bg-gray-200 flex-shrink-0 overflow-hidden rounded-md">
                <img src={personalInfo.photo} alt="Profile" className="w-full h-full object-cover" />
            </div>
        )}
        <div className="flex-grow">
            <h1 className="text-4xl font-bold text-[#1A365D] uppercase tracking-wide">
                {personalInfo.firstName} {personalInfo.lastName}
            </h1>

            <div className="mt-2 text-sm text-[#2C5282] flex flex-wrap gap-4 font-medium">
                {personalInfo.phone && (
                    <div className="flex items-center gap-1">
                        <Phone size={14} /> <span>{personalInfo.phone}</span>
                    </div>
                )}
                {personalInfo.email && (
                    <div className="flex items-center gap-1">
                        <Mail size={14} /> <span>{personalInfo.email}</span>
                    </div>
                )}
                {personalInfo.city && (
                    <div className="flex items-center gap-1">
                        <MapPin size={14} /> <span>{personalInfo.city}</span>
                    </div>
                )}
                {personalInfo.linkedin && (
                    <div className="flex items-center gap-1">
                        <Linkedin size={14} /> <span>{personalInfo.linkedin}</span>
                    </div>
                )}
            </div>

            {/* Tagline Box */}
            {personalInfo.tagline && (
                <div className="mt-4 p-4 bg-[#F7FAFC] border-l-4 border-[#1A365D] text-[#4A5568] italic text-sm">
                    {personalInfo.tagline}
                </div>
            )}
        </div>
      </div>

      <hr className="border-t-2 border-[#1A365D] mb-6" />

      {/* Experiences */}
      {experiences && experiences.length > 0 && (
          <section className="mb-6">
              <h2 className="text-xl font-bold text-[#1A365D] uppercase mb-4 border-b border-gray-200 pb-1">
                  Expériences Professionnelles
              </h2>
              <div className="space-y-4">
                  {experiences.map(exp => (
                      <div key={exp.id}>
                          <div className="flex justify-between items-baseline">
                              <h3 className="text-lg font-bold text-[#1A202C]">{exp.title}</h3>
                              <span className="text-sm font-semibold text-[#2C5282] whitespace-nowrap">
                                  {exp.startDate} - {exp.endDate}
                              </span>
                          </div>
                          <div className="text-[#4A5568] font-medium text-sm mb-1">
                              {exp.company} — {exp.city}
                          </div>
                          <p className="text-sm text-gray-600 whitespace-pre-line text-justify">
                              {exp.description}
                          </p>
                      </div>
                  ))}
              </div>
          </section>
      )}

      {/* Skills */}
      {skills && skills.length > 0 && (
          <section className="mb-6">
              <h2 className="text-xl font-bold text-[#1A365D] uppercase mb-4 border-b border-gray-200 pb-1">
                  Compétences
              </h2>
              <div className="grid grid-cols-2 gap-6">
                  {skills.map(cat => (
                      <div key={cat.id}>
                          <h3 className="font-bold text-[#2C5282] mb-2">{cat.category}</h3>
                          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                              {cat.items.map(item => (
                                  <li key={item.id}>{item.name}</li>
                              ))}
                          </ul>
                      </div>
                  ))}
              </div>
          </section>
      )}

      {/* Education */}
      {education && education.length > 0 && (
          <section className="mb-6">
              <h2 className="text-xl font-bold text-[#1A365D] uppercase mb-4 border-b border-gray-200 pb-1">
                  Formations
              </h2>
              <div className="space-y-3">
                  {education.map(edu => (
                      <div key={edu.id} className="flex justify-between">
                          <div>
                              <h3 className="font-bold text-[#1A202C]">{edu.degree}</h3>
                              <div className="text-sm text-[#4A5568]">{edu.school}, {edu.city}</div>
                          </div>
                          <div className="text-sm font-semibold text-[#2C5282]">{edu.dates}</div>
                      </div>
                  ))}
              </div>
          </section>
      )}

      {/* Languages & Interests */}
      <div className="grid grid-cols-2 gap-6">
          {languages && languages.length > 0 && (
              <section>
                  <h2 className="text-xl font-bold text-[#1A365D] uppercase mb-4 border-b border-gray-200 pb-1">
                      Langues
                  </h2>
                  <div className="space-y-2">
                      {languages.map(lang => (
                          <div key={lang.id} className="flex justify-between text-sm border-b border-dotted pb-1 last:border-0">
                              <span className="font-bold text-[#1A202C]">{lang.name}</span>
                              <span className="text-[#4A5568]">{lang.level}</span>
                          </div>
                      ))}
                  </div>
              </section>
          )}

          {interests && interests.length > 0 && (
              <section>
                  <h2 className="text-xl font-bold text-[#1A365D] uppercase mb-4 border-b border-gray-200 pb-1">
                      Centres d'intérêt
                  </h2>
                  <ul className="flex flex-wrap gap-2">
                      {interests.map(int => (
                          <li key={int.id} className="text-sm text-[#4A5568] bg-gray-100 px-2 py-1 rounded">
                              • {int.name}
                          </li>
                      ))}
                  </ul>
              </section>
          )}
      </div>
    </div>
  );
};

export default CVPreview;
