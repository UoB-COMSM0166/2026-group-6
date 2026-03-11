class AudioManager {
  constructor(resources) {
    this.resources = resources; // 关联资源管理器
    // 音量/开关状态（默认值，可自行调整）
    this.state = {
      bgm: { volume: 0.6, isMuted: false },    // BGM（背景音乐）
      sfx: { volume: 0.8, isMuted: false }     // SFX（音效：点击、门、攻击等）
    };
    // 初始化：给所有音频绑定音量
    this.initAudioVolumes();
  }

  // 初始化：给所有音频设置初始音量
  initAudioVolumes() {
    if (!this.resources?.sounds) return;

    // 1. BGM类音频（bgm、story）
    const bgmSounds = ['bgm', 'story'];
    bgmSounds.forEach(key => {
      const sound = this.resources.sounds[key];
      if (sound) sound.setVolume(this.state.bgm.volume);
    });

    // 2. SFX类音频（所有其他音效）
    const sfxKeys = Object.keys(this.resources.sounds).filter(key => {
      return !bgmSounds.includes(key) && 
             (typeof this.resources.sounds[key] === 'object' ? 
               Object.keys(this.resources.sounds[key]).length > 0 : 
               this.resources.sounds[key] instanceof p5.SoundFile);
    });

    // 递归设置音效音量（处理enemy/rope这类嵌套对象）
    this._setSfxVolume(this.resources.sounds, sfxKeys);
  }

  // 私有方法：递归设置音效音量
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

  // ========== 对外暴露的控制方法 ==========
  // 1. 设置BGM音量（0-1）
  setBgmVolume(volume) {
    this.state.bgm.volume = Math.max(0, Math.min(1, volume)); // 限制0-1
    if (this.resources.sounds.bgm) this.resources.sounds.bgm.setVolume(this.state.bgm.volume);
    if (this.resources.sounds.story) this.resources.sounds.story.setVolume(this.state.bgm.volume);
  }

  // 2. 设置音效音量（0-1）
  setSfxVolume(volume) {
    this.state.sfx.volume = Math.max(0, Math.min(1, volume));
    this._setSfxVolume(this.resources.sounds, Object.keys(this.resources.sounds));
  }

  // 3. 切换BGM静音/开启
  toggleBgmMute() {
    this.state.bgm.isMuted = !this.state.bgm.isMuted;
    if (this.resources.sounds.bgm) {
      this.state.bgm.isMuted ? this.resources.sounds.bgm.mute() : this.resources.sounds.bgm.unmute();
    }
    if (this.resources.sounds.story) {
      this.state.bgm.isMuted ? this.resources.sounds.story.mute() : this.resources.sounds.story.unmute();
    }
  }

  // 4. 切换音效静音/开启
  toggleSfxMute() {
    this.state.sfx.isMuted = !this.state.sfx.isMuted;
    // 遍历所有音效，切换静音
    const muteAllSfx = (obj) => {
      Object.keys(obj).forEach(key => {
        if (obj[key] instanceof p5.SoundFile) {
          this.state.sfx.isMuted ? obj[key].mute() : obj[key].unmute();
        } else if (typeof obj[key] === 'object') {
          muteAllSfx(obj[key]);
        }
      });
    };
    muteAllSfx(this.resources.sounds);
  }

  // 5. 获取当前状态（供UI显示）
  getState() {
    return { ...this.state };
  }
}