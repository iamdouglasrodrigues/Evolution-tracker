let _id = 0
const id = () => `ex_${++_id}`

const defaultPlan = {
  Pull: [
    { id: id(), name: 'Puxada Frontal', targetReps: '8–12', defaultSets: 4 },
    { id: id(), name: 'Remada Curvada', targetReps: '8–12', defaultSets: 4 },
    { id: id(), name: 'Remada Cavalinho', targetReps: '10–12', defaultSets: 3 },
    { id: id(), name: 'Pulldown Corda', targetReps: '12–15', defaultSets: 3 },
    { id: id(), name: 'Rosca Direta', targetReps: '10–12', defaultSets: 3 },
    { id: id(), name: 'Rosca Martelo', targetReps: '10–12', defaultSets: 3 },
  ],
  Push: [
    { id: id(), name: 'Supino Reto', targetReps: '6–10', defaultSets: 4 },
    { id: id(), name: 'Supino Inclinado Halteres', targetReps: '8–12', defaultSets: 4 },
    { id: id(), name: 'Desenvolvimento Ombro', targetReps: '8–12', defaultSets: 3 },
    { id: id(), name: 'Elevação Lateral', targetReps: '12–15', defaultSets: 4 },
    { id: id(), name: 'Tríceps Corda', targetReps: '12–15', defaultSets: 3 },
    { id: id(), name: 'Tríceps Francês', targetReps: '10–12', defaultSets: 3 },
  ],
  Legs: [
    { id: id(), name: 'Agachamento Livre', targetReps: '6–10', defaultSets: 4 },
    { id: id(), name: 'Leg Press', targetReps: '8–12', defaultSets: 4 },
    { id: id(), name: 'Cadeira Extensora', targetReps: '10–15', defaultSets: 3 },
    { id: id(), name: 'Mesa Flexora', targetReps: '10–12', defaultSets: 3 },
    { id: id(), name: 'Stiff', targetReps: '8–12', defaultSets: 3 },
    { id: id(), name: 'Panturrilha em Pé', targetReps: '12–20', defaultSets: 4 },
  ],
  Upper: [
    { id: id(), name: 'Supino Reto', targetReps: '8–10', defaultSets: 3 },
    { id: id(), name: 'Remada Cavalinho', targetReps: '8–10', defaultSets: 3 },
    { id: id(), name: 'Desenvolvimento Ombro', targetReps: '8–12', defaultSets: 3 },
    { id: id(), name: 'Puxada Frontal', targetReps: '10–12', defaultSets: 3 },
    { id: id(), name: 'Rosca Direta', targetReps: '10–12', defaultSets: 3 },
    { id: id(), name: 'Tríceps Corda', targetReps: '12–15', defaultSets: 3 },
  ],
  Lower: [
    { id: id(), name: 'Agachamento Livre', targetReps: '6–10', defaultSets: 4 },
    { id: id(), name: 'Leg Press', targetReps: '10–12', defaultSets: 3 },
    { id: id(), name: 'Cadeira Extensora', targetReps: '10–15', defaultSets: 3 },
    { id: id(), name: 'Mesa Flexora', targetReps: '10–12', defaultSets: 3 },
    { id: id(), name: 'Elevação Pélvica', targetReps: '10–15', defaultSets: 3 },
    { id: id(), name: 'Panturrilha Sentado', targetReps: '12–20', defaultSets: 4 },
  ],
}

export default defaultPlan
