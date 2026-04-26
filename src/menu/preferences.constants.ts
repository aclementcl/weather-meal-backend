export interface DietaryPreferenceDefinition {
  id: number;
  code: string;
  promptLabel: string;
}

export const DIETARY_PREFERENCES: DietaryPreferenceDefinition[] = [
  {
    id: 1,
    code: 'vegetarian',
    promptLabel: 'vegetarian',
  },
  {
    id: 2,
    code: 'gluten-free',
    promptLabel: 'gluten-free',
  },
  {
    id: 3,
    code: 'dairy-free',
    promptLabel: 'dairy-free',
  },
  {
    id: 4,
    code: 'high-protein',
    promptLabel: 'high-protein',
  },
];
