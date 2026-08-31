


const POSITIVE_WORDS = new Set([
  'agree','correct','right','good','great','excellent','strong','evidence',
  'proven','clearly','obviously','furthermore','moreover','benefit','advantage',
  'success','improve','solution','effective','support','therefore','consequently'
]);

const NEGATIVE_WORDS = new Set([
  'wrong','bad','terrible','fail','weak','false','never','impossible','stupid',
  'ridiculous','absurd','nonsense','idiot','fool','hate','worst','pathetic'
]);

const FILLER_WORDS = ['um', 'uh', 'like', 'you know', 'basically', 'literally', 'right', 'so', 'okay', 'actually'];

const TOXIC_WORDS = new Set([
  'stupid','idiot','dumb','moron','shut up','pathetic','loser','fool','trash',
  'garbage','worthless','ignorant','clueless'
]);

function analyzeSentiment(text: string) {
  const words = text.toLowerCase().split(/\s+/);
  let posCount = 0, negCount = 0;
  words.forEach(w => {
    if (POSITIVE_WORDS.has(w)) posCount++;
    if (NEGATIVE_WORDS.has(w)) negCount++;
  });
  const total = Math.max(posCount + negCount, 1);
  const score = (posCount - negCount) / total;
  const normalized = (score + 1) / 2;
  return {
    label: normalized > 0.55 ? 'POSITIVE' : normalized < 0.45 ? 'NEGATIVE' : 'NEUTRAL',
    score: Math.max(0, Math.min(1, normalized))
  };
}

function analyzeToxicity(text: string) {
  const words = text.toLowerCase().split(/\s+/);
  const toxicCount = words.filter(w => TOXIC_WORDS.has(w)).length;
  return Math.min(1, toxicCount * 0.25);
}

function analyzeFillers(text: string) {
  const lowerText = text.toLowerCase();
  const wordCount = Math.max(1, text.split(/\s+/).filter(Boolean).length);
  let fillerCount = 0;
  FILLER_WORDS.forEach(filler => {
    const regex = new RegExp('\\b' + filler + '\\b', 'gi');
    const matches = lowerText.match(regex);
    if (matches) fillerCount += matches.length;
  });
  return { fillerCount, fillerRate: fillerCount / wordCount, wordCount };
}

self.addEventListener('message', (event: MessageEvent) => {
  const { id, type, text } = event.data;

  try {
    if (type === 'analyze_turn') {
      const sentiment = analyzeSentiment(text);
      const toxicityScore = analyzeToxicity(text);
      const { fillerCount, fillerRate, wordCount } = analyzeFillers(text);

      (self as any).postMessage({
        id,
        status: 'complete',
        result: {
          sentiment,
          toxicityScore,
          toxicityDetails: { toxic: toxicityScore },
          fillerRate,
          fillerCount,
          wordCount
        }
      });
    } else if (type === 'persuasion') {
      (self as any).postMessage({
        id,
        status: 'complete',
        result: { persuasionEmbeddingScore: 0.6 }
      });
    } else if (type === 'logic_check') {
      (self as any).postMessage({
        id,
        status: 'complete',
        result: { logicResult: { label: 'neutral', score: 0.5 } }
      });
    }
  } catch (error: any) {
    (self as any).postMessage({ id, status: 'error', error: error.message });
  }
});
