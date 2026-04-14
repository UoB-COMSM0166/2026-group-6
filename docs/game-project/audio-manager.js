class AudioManager {
  constructor(resources) {
    this.resources = resources; // Reference to the resource manager
    
    // Volume and Mute states
    this.state = {
      bgm: { volume: 0.6, isMuted: false },    // BGM (Background Music)
      sfx: { volume: 0.8, isMuted: false }     // SFX (Sound Effects: clicks, doors, attacks, etc.)
    };

    // Initialization: Bind initial volumes to all audio files
    this.initAudioVolumes();
  }

  /**
   * Initialization: Set initial volumes for all audio resources
   */
  initAudioVolumes() {
    if (!this.resources?.sounds) return;

    // 1. BGM category sounds (e.g., main bgm, story themes)
    const bgmSounds = ['bgm', 'story'];
    bgmSounds.forEach(key => {
      const sound = this.resources.sounds[key];
      if (sound) sound.setVolume(this.state.bgm.volume);
    });

    // 2. SFX category (all other sound effects)
    const sfxKeys = Object.keys(this.resources.sounds).filter(key => {
      return !bgmSounds.includes(key) && 
             (typeof this.resources.sounds[key] === 'object' ? 
               Object.keys(this.resources.sounds[key]).length > 0 : 
               this.resources.sounds[key] instanceof p5.SoundFile);
    });

    // Recursively set SFX volume (handles nested objects like 'enemy' or 'rope')
    this._setSfxVolume(this.resources.sounds, sfxKeys);
  }

  /**
   * Private helper: Recursively set SFX volumes
   * @param {Object} soundObj - The sound object/collection
   * @param {Array} keys - Keys to iterate through
   */
  _setSfxVolume(soundObj, keys) {
    keys.forEach(key => {
      if (soundObj[key] instanceof p5.SoundFile) {
        soundObj[key].setVolume(this.state.sfx.volume);
      } else if (typeof soundObj[key] === 'object') {
        Object.keys(soundObj[key]).forEach(subKey => {
          if (soundObj[key][subKey] instanceof p5.SoundFile) {
            soundObj[key][subKey].setVolume(this.state.sfx.volume);
          }
        });
      }
    });
  }

  /**
   * 1. Set BGM volume
   * @param {number} volume - Value between 0 and 1
   */
  setBgmVolume(volume) {
    this.state.bgm.volume = Math.max(0, Math.min(1, volume)); // Clamp value between 0-1
    if (this.resources.sounds.bgm) this.resources.sounds.bgm.setVolume(this.state.bgm.volume);
    if (this.resources.sounds.story) this.resources.sounds.story.setVolume(this.state.bgm.volume);
  }

  /**
   * 2. Set SFX volume
   * @param {number} volume - Value between 0 and 1
   */
  setSfxVolume(volume) {
    this.state.sfx.volume = Math.max(0, Math.min(1, volume));
    this._setSfxVolume(this.resources.sounds, Object.keys(this.resources.sounds));
  }

  /**
   * 3. Toggle BGM Mute/Unmute
   */
  toggleBgmMute() {
    this.state.bgm.isMuted = !this.state.bgm.isMuted;
    const targetVolume = this.state.bgm.isMuted ? 0 : this.state.bgm.volume;
    
    if (this.resources.sounds.bgm) {
      this.resources.sounds.bgm.setVolume(targetVolume);
    }
    if (this.resources.sounds.story) {
      this.resources.sounds.story.setVolume(targetVolume);
    }
  }

  /**
   * 4. Toggle SFX Mute/Unmute
   */
  toggleSfxMute() {
    this.state.sfx.isMuted = !this.state.sfx.isMuted;
    
    // Traverse all sound effects and toggle mute
    const muteAllSfx = (obj) => {
      Object.keys(obj).forEach(key => {
        if (obj[key] instanceof p5.SoundFile) {
          // If muted, set volume to 0; otherwise, restore to stored SFX volume
          obj[key].setVolume(this.state.sfx.isMuted ? 0 : this.state.sfx.volume);
        } else if (typeof obj[key] === 'object') {
          muteAllSfx(obj[key]);
        }
      });
    };
    muteAllSfx(this.resources.sounds);
  }

  /**
   * 5. Get current state (useful for UI synchronization)
   * @returns {Object} A copy of the current audio state
   */
  getState() {
    return { ...this.state };
  }
}
