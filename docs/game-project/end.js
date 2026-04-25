const ENDING_DEFINITIONS = [
   { key: 'true', minProgress: 100, label: 'True Ending', audioKey: 'true' },
   { key: 'happy', minProgress: 95, label: 'Happy Ending', audioKey: 'happy' },
   { key: 'better', minProgress: 90, label: 'Better Ending', audioKey: 'better' },
   { key: 'normal', minProgress: 85, label: 'Normal Ending', audioKey: 'normal' },
   { key: 'sad', minProgress: 80, label: 'Sad Ending', audioKey: 'sad' },
   { key: 'bad', minProgress: 75, label: 'Bad Ending', audioKey: 'bad' }
];

function normalizeEndingProgress(progress = 0) {
   return Math.max(0, Math.min(100, Math.floor(progress)));
}

function getEndingSounds(resources) {
   return resources?.sounds?.endings || null;
}

function resolveEndingOutcome(progress = 0) {
   const normalizedProgress = normalizeEndingProgress(progress);
   const matchedEnding = ENDING_DEFINITIONS.find((ending) => normalizedProgress >= ending.minProgress)
      || ENDING_DEFINITIONS[ENDING_DEFINITIONS.length - 1];

   return {
      ...matchedEnding,
      progress: normalizedProgress
   };
}

function stopEndingAudio(resources) {
   const endings = getEndingSounds(resources);
   if (!endings) return;

   Object.values(endings).forEach((sound) => {
      if (sound?.isPlaying?.()) {
         sound.stop();
      }
   });
}

function getEndingAudio(resources, endingKey) {
   const endings = getEndingSounds(resources);
   if (!endings) return null;

   if (endingKey === 'true') {
      return endings.true || endings.happy || null;
   }

   return endings[endingKey] || null;
}

function playEndingAudio(resources, endingOutcome) {
   if (!endingOutcome) return null;

   stopEndingAudio(resources);

   const targetAudio = getEndingAudio(resources, endingOutcome.audioKey || endingOutcome.key);
   if (!targetAudio) return null;

   if (!targetAudio.isPlaying()) {
      targetAudio.play();
   }

   return targetAudio;
}
