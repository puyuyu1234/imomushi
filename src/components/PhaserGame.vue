<template>
  <div ref="phaserContainer" class="w-[1280px] h-[960px] m-auto"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import Phaser from 'phaser'
import GameScene from '@/scenes/Game' // あなたのゲームシーンのパスを調整してください

const phaserContainer = ref<HTMLElement | null>(null)
let game: Phaser.Game | null = null

onMounted(() => {
  if (phaserContainer.value) {
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO, // WebGL または Canvas を自動選択
      width: 320,
      height: 240,
      parent: phaserContainer.value, // Vue コンポーネントの要素を親として指定
      render: {
        // 描画設定
        antialias: false, // 全体のアンチエイリアシングを無効化
        pixelArt: true, // ピクセルアートモードを有効化 (画像などがぼやけにくくなる)
        roundPixels: true, // ピクセル境界に丸める（ちらつき防止）
        powerPreference: 'high-performance', // パフォーマンス優先
      },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 100 },
        },
      },
      scene: [GameScene], // GameSceneクラスを直接使用
    }

    game = new Phaser.Game(config)
  }
})

onUnmounted(() => {
  // コンポーネントがアンマウントされるときにゲームを破棄
  if (game) {
    game.destroy(true) // true を渡すと、関連する DOM 要素も削除
  }
})
</script>
