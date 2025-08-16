import { OutputField } from '../interfaces/models.interface';

// Sample data
export const sampleNoteFields: OutputField[] = [
  {
    id: 1,
    label: 'Diagnosis',
    value: '',
    guide: "Provide a detailed description of the patient's condition.",
    sample:
      'Feline asthma, presenting with intermittent coughing and mild respiratory distress.',
    order: 1,
  },
  {
    id: 2,
    label: 'Treatment Plan',
    value: '',
    guide: 'Outline the recommended treatment plan for the patient.',
    sample:
      'Initiate inhaled corticosteroids (Fluticasone 110mcg BID via AeroKat chamber). Consider adding bronchodilator if symptoms persist.',
    order: 2,
  },
  {
    id: 3,
    label: 'Follow-up',
    value: '',
    guide: 'Describe the recommended follow-up schedule and monitoring.',
    sample:
      'Recheck in 2 weeks to assess response to therapy and adjust medications as needed.',
    order: 3,
  },
  {
    id: 4,
    label: 'Owner Instructions',
    value: '',
    guide:
      'List instructions for the owner regarding home care and monitoring.',
    sample:
      'Monitor for coughing, wheezing, or increased respiratory effort. Ensure proper inhaler technique.',
    order: 4,
  },
  {
    id: 5,
    label: 'Medications',
    value: '',
    guide: 'List all prescribed medications and their dosages.',
    sample:
      'Fluticasone 110mcg BID via inhaler. Albuterol as rescue inhaler if acute symptoms develop.',
    order: 5,
  },
  {
    id: 6,
    label: 'Dietary Recommendations',
    value: '',
    guide: 'Provide dietary advice or restrictions if applicable.',
    sample:
      'Continue current diet. Consider hypoallergenic diet if symptoms do not improve.',
    order: 6,
  },
  {
    id: 7,
    label: 'Environmental Modifications',
    value: '',
    guide: 'Suggest any environmental changes to help the patient.',
    sample:
      'Minimize exposure to dust, smoke, and aerosols. Use air purifiers if possible.',
    order: 7,
  },
];
