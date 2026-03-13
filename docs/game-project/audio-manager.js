class AudioManager {
  constructor(resources) {
    this.resources = resources; 
    //primary status
    this.state = {
      bgm: { volume: 0.6, isMuted: false },    
      sfx: { volume: 1.0, isMuted: false }     
    };
    //init audiovolumes
    this.initAudioVolumes();
  }

  initAudioVolumes() {
    if (!this.resources?.sounds) return;

    // BGM
    const bgmSounds = ['bgm', 'story'];
    bgmSounds.forEach(key => {
      const sound = this.resources.sounds[key];
      if (sound) sound.setVolume(this.state.bgm.volume);
    });

    // Sound Effects
    const sfxKeys = Object.keys(this.resources.sounds).filter(key => {
      return !bgmSounds.includes(key) && 
             (typeof this.resources.sounds[key] === 'object' ? 
               Object.keys(this.resources.sounds[key]).length > 0 : 
               this.resources.sounds[key] instanceof p5.SoundFile);
    });

    // Batch modification lots of sounds
    this._setSfxVolume(this.resources.sounds, sfxKeys);
  }

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

  // 1. set BGM volume（0-1）
  setBgmVolume(volume) {
    this.state.bgm.volume = Math.max(0, Math.min(1, volume)); // restirct 0-1
    if (this.resources.sounds.bgm) this.resources.sounds.bgm.setVolume(this.state.bgm.volume);
    if (this.resources.sounds.story) this.resources.sounds.story.setVolume(this.state.bgm.volume);
  }

  // 2. set sounds volume（0-2）, 1 is too small to hear
  setSfxVolume(volume) {
    this.state.sfx.volume = Math.max(0, Math.min(2, volume));
    this._setSfxVolume(this.resources.sounds, Object.keys(this.resources.sounds));
  }

  // mute/unmute BGM
  toggleBgmMute() {
    this.state.bgm.isMuted = !this.state.bgm.isMuted;
    if (this.resources.sounds.bgm) {
      this.state.bgm.isMuted ? this.resources.sounds.bgm.setVolume(0) : this.resources.sounds.bgm.setVolume(1);
    }
    if (this.resources.sounds.story) {
      this.state.bgm.isMuted ? this.resources.sounds.story.setVolume(0) : this.resources.sounds.story.setVolume(1);
    }
  }

  // mute/unmute sounds
  toggleSfxMute() {
    this.state.sfx.isMuted = !this.state.sfx.isMuted;
    // silent
    //修改此处，不静音BGM
    const muteAllSfx = (obj) => {
      Object.keys(obj).forEach(key => {
        //all
        if (obj[key] instanceof p5.SoundFile) {
          this.state.sfx.isMuted ? obj[key].setVolume(0) : obj[key].setVolume(1);
        } else if (typeof obj[key] === 'object') {
          muteAllSfx(obj[key]);
        }
      });
    };
    muteAllSfx(this.resources.sounds);
  }

  // UI show status
  getState() {
    return { ...this.state };
  }
}