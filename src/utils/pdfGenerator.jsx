import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font, Link, Image } from '@react-pdf/renderer';

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30, // Approx 10-15mm
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  headerLeft: {
    marginRight: 20,
  },
  photo: {
    width: 80,
    height: 80,
    objectFit: 'cover',
    borderRadius: 4,
  },
  headerRight: {
    flexGrow: 1,
  },
  name: {
    fontSize: 24,
    color: '#1A365D',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  contact: {
    fontSize: 10,
    color: '#2C5282',
    marginTop: 5,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  contactItem: {
    marginRight: 10,
  },
  taglineBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#F7FAFC',
    borderLeftWidth: 4,
    borderLeftColor: '#1A365D',
  },
  taglineText: {
    fontSize: 10,
    color: '#4A5568',
    fontStyle: 'italic',
  },
  separator: {
    borderBottomWidth: 2,
    borderBottomColor: '#1A365D',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#1A365D',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 4,
    marginBottom: 10,
  },
  experienceItem: {
    marginBottom: 10,
  },
  expHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  expTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  expDate: {
    fontSize: 10,
    color: '#2C5282',
    fontWeight: 'bold',
  },
  expCompany: {
    fontSize: 10,
    color: '#4A5568',
    marginBottom: 4,
  },
  expDesc: {
    fontSize: 10,
    color: '#2D3748',
    textAlign: 'justify',
    lineHeight: 1.4,
  },
  twoCol: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 20,
  },
  col: {
    width: '48%',
  },
  skillCategory: {
    marginBottom: 10,
  },
  skillCatTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#2C5282',
    marginBottom: 2,
  },
  skillItem: {
    fontSize: 10,
    color: '#4A5568',
    marginLeft: 10,
  },
  eduItem: {
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  eduMain: {
    width: '75%',
  },
  eduDate: {
    fontSize: 10,
    color: '#2C5282',
    fontWeight: 'bold',
    textAlign: 'right',
  },
  eduDegree: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  eduSchool: {
    fontSize: 10,
    color: '#4A5568',
  },
  langItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 2,
    borderStyle: 'dotted',
  },
  interestList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
  },
  interestItem: {
      fontSize: 10,
      color: '#4A5568',
      marginRight: 10,
      backgroundColor: '#F7FAFC',
      padding: 3,
  }
});

export const CVDocument = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        {data.personalInfo.photo && (
            <View style={styles.headerLeft}>
                <Image src={data.personalInfo.photo} style={styles.photo} />
            </View>
        )}
        <View style={styles.headerRight}>
          <Text style={styles.name}>{data.personalInfo.firstName} {data.personalInfo.lastName}</Text>
          <View style={styles.contact}>
             {data.personalInfo.phone && <Text style={styles.contactItem}>Tel: {data.personalInfo.phone}</Text>}
             {data.personalInfo.email && <Text style={styles.contactItem}>Email: {data.personalInfo.email}</Text>}
             {data.personalInfo.city && <Text style={styles.contactItem}>Loc: {data.personalInfo.city}</Text>}
             {data.personalInfo.linkedin && <Text style={styles.contactItem}>LinkedIn: {data.personalInfo.linkedin}</Text>}
          </View>
          {data.personalInfo.tagline && (
              <View style={styles.taglineBox}>
                  <Text style={styles.taglineText}>{data.personalInfo.tagline}</Text>
              </View>
          )}
        </View>
      </View>

      <View style={styles.separator} />

      {/* Experience */}
      {data.experiences && data.experiences.length > 0 && (
          <View style={{ marginBottom: 15 }}>
              <Text style={styles.sectionTitle}>Expériences Professionnelles</Text>
              {data.experiences.map(exp => (
                  <View key={exp.id} style={styles.experienceItem}>
                      <View style={styles.expHeader}>
                          <Text style={styles.expTitle}>{exp.title}</Text>
                          <Text style={styles.expDate}>{exp.startDate} - {exp.endDate}</Text>
                      </View>
                      <Text style={styles.expCompany}>{exp.company} — {exp.city}</Text>
                      <Text style={styles.expDesc}>{exp.description}</Text>
                  </View>
              ))}
          </View>
      )}

      {/* Skills */}
      {data.skills && data.skills.length > 0 && (
          <View style={{ marginBottom: 15 }}>
              <Text style={styles.sectionTitle}>Compétences</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {data.skills.map((cat, index) => (
                      <View key={cat.id} style={[styles.skillCategory, { width: '50%' }]}>
                          <Text style={styles.skillCatTitle}>{cat.category}</Text>
                          {cat.items.map(item => (
                              <Text key={item.id} style={styles.skillItem}>• {item.name}</Text>
                          ))}
                      </View>
                  ))}
              </View>
          </View>
      )}

      {/* Education */}
      {data.education && data.education.length > 0 && (
          <View style={{ marginBottom: 15 }}>
              <Text style={styles.sectionTitle}>Formations</Text>
              {data.education.map(edu => (
                  <View key={edu.id} style={styles.eduItem}>
                      <View style={styles.eduMain}>
                          <Text style={styles.eduDegree}>{edu.degree}</Text>
                          <Text style={styles.eduSchool}>{edu.school}, {edu.city}</Text>
                      </View>
                      <Text style={styles.eduDate}>{edu.dates}</Text>
                  </View>
              ))}
          </View>
      )}

      {/* Languages & Interests */}
      <View style={styles.twoCol}>
          {data.languages && data.languages.length > 0 && (
              <View style={styles.col}>
                  <Text style={styles.sectionTitle}>Langues</Text>
                  {data.languages.map(lang => (
                      <View key={lang.id} style={styles.langItem}>
                          <Text style={{ fontSize: 10, fontWeight: 'bold' }}>{lang.name}</Text>
                          <Text style={{ fontSize: 10, color: '#4A5568' }}>{lang.level}</Text>
                      </View>
                  ))}
              </View>
          )}

          {data.interests && data.interests.length > 0 && (
              <View style={styles.col}>
                  <Text style={styles.sectionTitle}>Centres d'intérêt</Text>
                  <View style={styles.interestList}>
                      {data.interests.map(int => (
                          <Text key={int.id} style={styles.interestItem}>• {int.name}</Text>
                      ))}
                  </View>
              </View>
          )}
      </View>

    </Page>
  </Document>
);
