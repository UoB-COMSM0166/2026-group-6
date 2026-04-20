class AudioManager {
  constructor(resources) {
    this.resources = resources;
    this.state = {
      bgm: { volume: 0.6, isMuted: false },
      sfx: { volume: 1.0, isMuted: false }
    };

    this.gameplayPlaylistIndex = 0;
    this.currentGameplayTrack = null;
    this.gameplayAudioMode = 'playlist';
    this.waitingForBossLoop = false;

    this.initAudioVolumes();
  }

  initAudioVolumes() {
    if (!this.resources?.sounds) return;

    this._applyBgmVolume();

    const sfxKeys = this._getSfxKeys();
    this._setSfxVolume(this.resources.sounds, sfxKeys);
  }

  _getAllBgmSounds() {
    const sounds = [
      this.resources?.sounds?.story,
      this.resources?.sounds?.begin,
      this.resources?.sounds?.bgm,
      this.resources?.sounds?.boss,
      this.resources?.sounds?.alarm
    ];

    const playlist = this.resources?.sounds?.bgmPlaylist;
    if (Array.isArray(playlist)) {
      sounds.push(...playlist);
    }

    return [...new Set(sounds.filter(Boolean))];
  }

  _applyBgmVolume() {
    const targetVolume = this.state.bgm.isMuted ? 0 : this.state.bgm.volume;
    this._getAllBgmSounds().forEach((sound) => sound.setVolume(targetVolume));
  }

  _getSfxKeys() {
    if (!this.resources?.sounds) return [];

    const bgmSet = new Set(this._getAllBgmSounds());
    const reservedBgmKeys = new Set(['bgmPlaylist']);
    return Object.keys(this.resources.sounds).filter((key) => {
      const target = this.resources.sounds[key];
      if (reservedBgmKeys.has(key)) return false;
      if (bgmSet.has(target)) return false;
      return (typeof target === 'object')
        ? Object.keys(target || {}).length > 0
        : target instanceof p5.SoundFile;
    });
  }

  _setSfxVolume(soundObj, keys) {
    keys.forEach((key) => {
      if (soundObj[key] instanceof p5.SoundFile) {
        soundObj[key].setVolume(this.state.sfx.volume);
      } else if (typeof soundObj[key] === 'object') {
        Object.keys(soundObj[key]).forEach((subKey) => {
          if (soundObj[key][subKey] instanceof p5.SoundFile) {
            soundObj[key][subKey].setVolume(this.state.sfx.volume);
          }
        });
      }
    });
  }

  _setSfxVolumeTo(keys, volume) {
    keys.forEach((key) => {
      const target = this.resources.sounds[key];
      if (target instanceof p5.SoundFile) {
        target.setVolume(volume);
      } else if (typeof target === 'object' && target) {
        Object.keys(target).forEach((subKey) => {
          if (target[subKey] instanceof p5.SoundFile) {
            target[subKey].setVolume(volume);
          }
        });
      }
    });
  }

  setBgmVolume(volume) {
    this.state.bgm.volume = Math.max(0, Math.min(1, volume));
    this._applyBgmVolume();
  }

  setSfxVolume(volume) {
    this.state.sfx.volume = Math.max(0, Math.min(2, volume));
    const sfxKeys = this._getSfxKeys();
    this._setSfxVolumeTo(sfxKeys, this.state.sfx.isMuted ? 0 : this.state.sfx.volume);
  }

  toggleBgmMute() {
    this.state.bgm.isMuted = !this.state.bgm.isMuted;
    this._applyBgmVolume();
  }

  toggleSfxMute() {
    this.state.sfx.isMuted = !this.state.sfx.isMuted;
    const sfxKeys = this._getSfxKeys();
    this._setSfxVolumeTo(sfxKeys, this.state.sfx.isMuted ? 0 : this.state.sfx.volume);
  }

  getState() {
    return { ...this.state };
  }

  startGameplayBgmCycle(reset = false) {
    const playlist = this.resources?.sounds?.bgmPlaylist;
    if (!Array.isArray(playlist) || playlist.length === 0) return;

    if (reset) {
      this.gameplayPlaylistIndex = 0;
      this.currentGameplayTrack = null;
    }

    this.gameplayAudioMode = 'playlist';
    this.waitingForBossLoop = false;
    this._stopBossAudio();

    if (!this.currentGameplayTrack || !this.currentGameplayTrack.isPlaying()) {
      this._playNextGameplayTrack();
    }
  }

  stopGameplayBgmCycle() {
    this._stopPlaylistAudio();
    this._stopBossAudio();
    this.currentGameplayTrack = null;
    this.waitingForBossLoop = false;
  }

  updateGameplayAudio(gm, appState) {
    if (appState !== 'PLAYING' || !gm) {
      this._stopBossAudio();
      return;
    }

    const bossActive = gm.entities?.some((entity) => entity instanceof Boss && entity.active && !entity.purified);

    if (bossActive) {
      this._enterBossAudioMode();
      return;
    }

    this._enterPlaylistAudioMode();
  }

  _enterPlaylistAudioMode() {
    if (this.gameplayAudioMode === 'boss') {
      this._stopBossAudio();
      this.gameplayAudioMode = 'playlist';
      this.currentGameplayTrack = null;
    }

    if (!this.currentGameplayTrack || !this.currentGameplayTrack.isPlaying()) {
      this._playNextGameplayTrack();
    }
  }

  _enterBossAudioMode() {
    const alarm = this.resources?.sounds?.alarm;
    const boss = this.resources?.sounds?.boss;
    if (!alarm || !boss) return;

    if (this.gameplayAudioMode !== 'boss') {
      this._stopPlaylistAudio();
      boss.stop();
      alarm.stop();
      alarm.play();
      this.gameplayAudioMode = 'boss';
      this.waitingForBossLoop = true;
      return;
    }

    if (this.waitingForBossLoop && !alarm.isPlaying()) {
      boss.loop();
      this.waitingForBossLoop = false;
    }
  }

  _playNextGameplayTrack() {
    const playlist = this.resources?.sounds?.bgmPlaylist;
    if (!Array.isArray(playlist) || playlist.length === 0) return;

    const nextTrack = playlist[this.gameplayPlaylistIndex % playlist.length];
    if (!nextTrack) return;

    this._stopPlaylistAudio();
    this.currentGameplayTrack = nextTrack;
    this.currentGameplayTrack.play();
    this.gameplayPlaylistIndex = (this.gameplayPlaylistIndex + 1) % playlist.length;
  }

  _stopPlaylistAudio() {
    const playlist = this.resources?.sounds?.bgmPlaylist;
    if (Array.isArray(playlist)) {
      playlist.forEach((track) => track.stop());
    }
    this.resources?.sounds?.bgm?.stop();
  }

  _stopBossAudio() {
    this.resources?.sounds?.alarm?.stop();
    this.resources?.sounds?.boss?.stop();
    this.waitingForBossLoop = false;
  }
}
