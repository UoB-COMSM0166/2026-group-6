class AudioManager {
  constructor(resources) {
    this.resources = resources;
    this.state = {
      bgm: { volume: 0.6, isMuted: false },
      sfx: { volume: 0.6, isMuted: false }
    };

    this.gameplayPlaylistIndices = {
      normal: 0,
      purified: 0
    };
    this.currentGameplayTrack = null;
    this.activePlaylistKey = 'normal';
    this.gameplayAudioMode = 'playlist';
    this.waitingForBossLoop = false;
    this.cachedBgmSounds = [];
    this.cachedSfxKeys = [];
    this.quieterBgmSounds = new Set();
    this.lastGameplayAudioUpdateAt = -Infinity;
    this.lastGameplayAudioAppState = null;
    this.gameplayAudioUpdateInterval = 80;

    this.initAudioVolumes();
  }

  initAudioVolumes() {
    if (!this.resources?.sounds) return;
    this.cachedBgmSounds = this._collectAllBgmSounds();
    this.cachedSfxKeys = this._collectSfxKeys();
    this.quieterBgmSounds = new Set(this.resources?.sounds?.quieterBgm || []);

    this._applyBgmVolume();

    this._setSfxVolume(this.resources.sounds, this.cachedSfxKeys);
  }

  _collectAllBgmSounds() {
    const sounds = [
      this.resources?.sounds?.story,
      this.resources?.sounds?.begin,
      this.resources?.sounds?.bgm,
      this.resources?.sounds?.boss,
      this.resources?.sounds?.alarm
    ];

    const endingSounds = Object.values(this.resources?.sounds?.endings || {});
    sounds.push(...endingSounds);

    const playlists = this.resources?.sounds?.bgmPlaylists || {};
    Object.values(playlists).forEach((playlist) => {
      if (Array.isArray(playlist)) {
        sounds.push(...playlist);
      }
    });

    return [...new Set(sounds.filter(Boolean))];
  }

  _getAllBgmSounds() {
    return this.cachedBgmSounds;
  }

  _applyBgmVolume() {
    const baseVolume = this.state.bgm.isMuted ? 0 : this.state.bgm.volume;
    this._getAllBgmSounds().forEach((sound) => {
      const volumeScale = this.quieterBgmSounds.has(sound) ? 0.8 : 1;
      sound.setVolume(baseVolume * volumeScale);
    });
  }

  _collectSfxKeys() {
    if (!this.resources?.sounds) return [];

    const bgmSet = new Set(this.cachedBgmSounds);
    const reservedBgmKeys = new Set(['bgmPlaylists']);
    return Object.keys(this.resources.sounds).filter((key) => {
      const target = this.resources.sounds[key];
      if (reservedBgmKeys.has(key)) return false;
      if (bgmSet.has(target)) return false;
      return (typeof target === 'object')
        ? Object.keys(target || {}).length > 0
        : target instanceof p5.SoundFile;
    });
  }

  _getSfxKeys() {
    return this.cachedSfxKeys;
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
    this._setSfxVolumeTo(this.cachedSfxKeys, this.state.sfx.isMuted ? 0 : this.state.sfx.volume);
  }

  toggleBgmMute() {
    this.state.bgm.isMuted = !this.state.bgm.isMuted;
    this._applyBgmVolume();
  }

  toggleSfxMute() {
    this.state.sfx.isMuted = !this.state.sfx.isMuted;
    this._setSfxVolumeTo(this.cachedSfxKeys, this.state.sfx.isMuted ? 0 : this.state.sfx.volume);
  }

  getState() {
    return { ...this.state };
  }

  startGameplayBgmCycle(reset = false) {
    if (reset) {
      this.gameplayPlaylistIndices.normal = 0;
      this.gameplayPlaylistIndices.purified = 0;
      this.currentGameplayTrack = null;
    }

    this.gameplayAudioMode = 'playlist';
    this.waitingForBossLoop = false;
    this.activePlaylistKey = 'normal';
    this._stopBossAudio();

    if (!this.currentGameplayTrack || !this.currentGameplayTrack.isPlaying()) {
      this._playNextGameplayTrack(this.activePlaylistKey);
    }
  }

  stopGameplayBgmCycle() {
    this._stopAllBackgroundAudio();
    this._stopGameplayLoopingSfx();
    this.currentGameplayTrack = null;
    this.waitingForBossLoop = false;
    this.gameplayAudioMode = 'playlist';
  }

  updateGameplayAudio(gm, appState) {
    if (!this._shouldUpdateGameplayAudio(appState)) {
      return;
    }

    if (appState !== 'PLAYING' || !gm) {
      this._stopBossAudio();
      this._stopGameplayLoopingSfx();
      return;
    }

    const boss = gm.entities?.find((entity) => entity instanceof Boss && entity.active && !entity.purified);
    if (boss) {
      this._enterBossAudioMode(boss);
      return;
    }

    this._enterPlaylistAudioMode(this._resolvePlaylistKey(gm));
  }

  _shouldUpdateGameplayAudio(appState) {
    const now = typeof millis === 'function' ? millis() : Date.now();
    const appStateChanged = this.lastGameplayAudioAppState !== appState;

    this.lastGameplayAudioAppState = appState;
    if (appStateChanged) {
      this.lastGameplayAudioUpdateAt = now;
      return true;
    }

    if (now - this.lastGameplayAudioUpdateAt < this.gameplayAudioUpdateInterval) {
      return false;
    }

    this.lastGameplayAudioUpdateAt = now;
    return true;
  }

  _resolvePlaylistKey(gm) {
    return gm?.environmentChanged ? 'purified' : 'normal';
  }

  _getPlaylist(playlistKey = this.activePlaylistKey) {
    const playlists = this.resources?.sounds?.bgmPlaylists || {};
    return Array.isArray(playlists[playlistKey]) ? playlists[playlistKey] : [];
  }

  _enterPlaylistAudioMode(playlistKey) {
    if (this.gameplayAudioMode === 'boss') {
      this._stopBossAudio();
      this.currentGameplayTrack = null;
    }

    this.gameplayAudioMode = 'playlist';

    if (this.activePlaylistKey !== playlistKey) {
      this.activePlaylistKey = playlistKey;
      this.currentGameplayTrack = null;
      this._stopPlaylistAudio();
    }

    if (!this.currentGameplayTrack || !this.currentGameplayTrack.isPlaying()) {
      this._playNextGameplayTrack(this.activePlaylistKey);
    }
  }

  _enterBossAudioMode(boss) {
    const bossTrack = this.resources?.sounds?.boss;
    if (!bossTrack) return;

    if (this.gameplayAudioMode !== 'boss') {
      this._stopAllBackgroundAudio();
      this._playSound(bossTrack);
      this.gameplayAudioMode = 'boss';
      this.waitingForBossLoop = true;
    } else if (this.waitingForBossLoop && !bossTrack.isPlaying()) {
      this._playSound(bossTrack, { loop: true });
      this.waitingForBossLoop = false;
    }

    this._updateFloodAlarm(boss);
  }

  _updateFloodAlarm(boss) {
    const alarm = this.resources?.sounds?.alarm;
    if (!alarm) return;

    const isRisingFlood = boss?.state === 'FLOOD' && boss.stateTimer >= 120 && boss.stateTimer < 180;
    if (isRisingFlood) {
      this._playSound(alarm, { loop: true });
      return;
    }

    this._stopSound(alarm);
  }

  _playNextGameplayTrack(playlistKey = this.activePlaylistKey) {
    const playlist = this._getPlaylist(playlistKey);
    if (playlist.length === 0) return;

    const nextIndex = this.gameplayPlaylistIndices[playlistKey] % playlist.length;
    const nextTrack = playlist[nextIndex];
    if (!nextTrack) return;

    this._stopPlaylistAudio();
    this.currentGameplayTrack = nextTrack;
    this._playSound(this.currentGameplayTrack);
    this.gameplayPlaylistIndices[playlistKey] = (nextIndex + 1) % playlist.length;
  }

  _stopPlaylistAudio() {
    const playlists = this.resources?.sounds?.bgmPlaylists || {};
    Object.values(playlists).forEach((playlist) => {
      if (Array.isArray(playlist)) {
        playlist.forEach((track) => this._stopSound(track));
      }
    });
    this._stopSound(this.resources?.sounds?.bgm);
  }

  _stopBossAudio() {
    this._stopSound(this.resources?.sounds?.alarm);
    this._stopSound(this.resources?.sounds?.boss);
    this.waitingForBossLoop = false;
  }

  _stopAllBackgroundAudio() {
    this._stopPlaylistAudio();
    this._stopBossAudio();
    this._stopSound(this.resources?.sounds?.story);
    this._stopSound(this.resources?.sounds?.begin);
    stopEndingAudio(this.resources);
  }

  _stopGameplayLoopingSfx() {
    this._stopSound(this.resources?.sounds?.underwater);
    this._stopSound(this.resources?.sounds?.ladder);
  }

  _playSound(sound, options = {}) {
    if (!sound) return;

    const { loop = false } = options;
    if (sound.isPlaying()) return;

    if (loop) {
      sound.loop();
      return;
    }

    sound.play();
  }

  _stopSound(sound) {
    if (sound?.isPlaying()) {
      sound.stop();
    }
  }
}
