/**
 * A realistic bilingual lesson as `differentiate-lesson` returns it: a Spanish
 * handout with the parallel English column, plus an English-only handout.
 * Hand-written for tests — no real teacher lesson is checked into the repo.
 */

export const SPANISH_HANDOUT_CONTENT = `# El Ciclo del Agua

**Nombre:** [BLANK] **Fecha:** [BLANK]

## Objetivo de Aprendizaje

Voy a explicar las cuatro etapas del ciclo del agua.

## Vocabulario

| Palabra | Significado |
| --- | --- |
| evaporación | El agua se convierte en vapor. |
| condensación | El vapor se convierte en gotas. |
| precipitación | El agua cae como lluvia o nieve. |

[VISUAL: A labeled diagram showing the water cycle with arrows for evaporation, condensation, and precipitation]
*Diagrama etiquetado del ciclo del agua*

## Práctica

1. ¿Qué pasa durante la evaporación?

[ANSWER LINE]

2. Nombra dos formas de precipitación.

[ANSWER LINE]

## Reflexión

Escribe una cosa nueva que aprendiste hoy.

[ANSWER LINE]
`;

export const SPANISH_HANDOUT_ENGLISH_CONTENT = `# The Water Cycle

**Name:** [BLANK] **Date:** [BLANK]

## Learning Target

I can explain the four stages of the water cycle.

## Vocabulary

| Word | Meaning |
| --- | --- |
| evaporation | Water turns into vapor. |
| condensation | Vapor turns into droplets. |
| precipitation | Water falls as rain or snow. |

[VISUAL: A labeled diagram showing the water cycle with arrows for evaporation, condensation, and precipitation]

## Practice

1. What happens during evaporation?

[ANSWER LINE]

2. Name two forms of precipitation.

[ANSWER LINE]

## Reflection

Write one new thing you learned today.

[ANSWER LINE]
`;

export const ENGLISH_HANDOUT_CONTENT = `# The Water Cycle

**Name:** [BLANK] **Date:** [BLANK]

## Learning Target

I can explain and model the four stages of the water cycle.

## Vocabulary

| Word | Meaning |
| --- | --- |
| evaporation | Liquid water becomes water vapor. |
| condensation | Water vapor cools into droplets. |
| precipitation | Water returns to the ground. |

[VISUAL: A labeled diagram showing the water cycle with arrows for evaporation, condensation, and precipitation]

## Practice

1. Explain how energy from the sun drives evaporation.

[ANSWER LINE]

2. Predict what happens to the cycle if temperatures rise.

[ANSWER LINE]

## Reflection

What part of the cycle would you most like to investigate?

[ANSWER LINE]
`;

export const TEACHER_GUIDE = `# Water Cycle — Teacher Guide

## Lesson Overview

Students model the four stages of the water cycle.

## Materials Needed

- Clear cups
- Plastic wrap

## Pacing Guide

| Segment | Minutes |
| --- | --- |
| Warm up | 5 |
| Model | 15 |
| Practice | 20 |

## Differentiation Strategies by Group

Provide the Spanish column alongside the English column for the bilingual group.

## Formative Assessment Checkpoints

Check each student's reflection before the exit ticket.
`;

export const BILINGUAL_LESSON = {
  teacherGuide: TEACHER_GUIDE,
  studentHandouts: [
    {
      groupId: 'group-es',
      groupName: 'Sparks',
      level: 'embers',
      language: 'Spanish',
      content: SPANISH_HANDOUT_CONTENT,
      englishContent: SPANISH_HANDOUT_ENGLISH_CONTENT,
    },
    {
      groupId: 'group-en',
      groupName: 'Blazers',
      level: 'blazers',
      language: 'English',
      content: ENGLISH_HANDOUT_CONTENT,
      englishContent: null,
    },
  ],
};

export const VISUAL_DESCRIPTION =
  'A labeled diagram showing the water cycle with arrows for evaporation, condensation, and precipitation';

export const IMAGE_URL = 'https://storage.example.test/lesson-diagrams/water-cycle.png';

export function imageMapFixture(): Map<string, string> {
  return new Map([[VISUAL_DESCRIPTION, IMAGE_URL]]);
}

export function altTextMapFixture(): Map<string, string> {
  return new Map([[
    VISUAL_DESCRIPTION,
    'Four arrows form a loop between a lake, a cloud, and rain falling on a hillside.',
  ]]);
}

export function longDescriptionMapFixture(): Map<string, string> {
  return new Map([[
    VISUAL_DESCRIPTION,
    'Water rises from the lake as vapor, gathers into a cloud, falls as rain on the hillside, and drains back to the lake.',
  ]]);
}
