import Phaser from 'phaser'
import { Bullet } from './bullet'
import { Thread } from './thread'

export class Player extends Phaser.Physics.Arcade.Sprite {
  private mouthOffset: Phaser.Math.Vector2
  private currentBullet: Bullet | null = null
  private currentThread: Thread | null = null
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | undefined

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player')

    scene.add.existing(this)
    scene.physics.add.existing(this)

    this.setSize(12, 12)
    this.setCollideWorldBounds(true)

    this.mouthOffset = new Phaser.Math.Vector2(8, 0)

    if (this.body instanceof Phaser.Physics.Arcade.Body) {
      this.body.setGravityY(300)
      this.body.setMaxVelocity(200, 400)
      this.body.setDragX(800)
    }

    this.cursors = scene.input.keyboard?.createCursorKeys()

    scene.input.on('pointerdown', this.onMouseDown, this)
    scene.input.on('pointerup', this.onMouseUp, this)
  }

  getMouthPosition(): Phaser.Math.Vector2 {
    return new Phaser.Math.Vector2(this.x + this.mouthOffset.x, this.y + this.mouthOffset.y)
  }

  private onMouseDown(pointer: Phaser.Input.Pointer) {
    const debugScene = this.scene as Phaser.Scene & { addDebugDot?: (x: number, y: number) => void }
    if (debugScene.addDebugDot) {
      debugScene.addDebugDot(pointer.worldX, pointer.worldY)
    }

    // 既に弾丸や糸が存在する場合は削除してから新しいものを作成
    if (this.currentThread) {
      this.currentThread.destroy()
      this.currentThread = null
    }
    if (this.currentBullet) {
      this.currentBullet.destroy()
      this.currentBullet = null
    }

    const mouthPos = this.getMouthPosition()
    console.log('Mouth position:', mouthPos.x, mouthPos.y)
    const direction = new Phaser.Math.Vector2(
      pointer.worldX - mouthPos.x,
      pointer.worldY - mouthPos.y,
    )

    console.log(
      'Mouse click direction vector:',
      direction.x,
      direction.y,
      'length:',
      direction.length(),
    )

    this.currentBullet = new Bullet(this.scene, mouthPos.x, mouthPos.y, direction)

    // Threadでプレイヤーと弾丸を結ぶ
    this.currentThread = new Thread(this.scene, this, this.currentBullet)

    // 弾丸と壁の衝突を設定
    const gameScene = this.scene as Phaser.Scene & {
      wallLayer?: Phaser.Tilemaps.TilemapLayer
      physics: Phaser.Physics.Arcade.ArcadePhysics
    }
    if (gameScene.wallLayer && gameScene.physics && this.currentBullet) {
      console.log('Setting up collider between bullet and wall layer')
      gameScene.physics.add.collider(this.currentBullet, gameScene.wallLayer, () => {
        console.log('Bullet collided with wall!')
        if (this.currentBullet && this.currentThread) {
          // threadを赤色に変更
          this.currentThread.setAttached(this.currentBullet.x, this.currentBullet.y)
          // 弾丸を削除
          this.currentBullet.destroy()
          this.currentBullet = null
        }
      })
    }
  }

  private onMouseUp() {
    // マウスを離したら常に弾丸とthreadを削除
    if (this.currentThread) {
      this.currentThread.destroy()
      this.currentThread = null
    }
    if (this.currentBullet) {
      this.currentBullet.destroy()
      this.currentBullet = null
    }
  }

  update() {
    if (this.currentBullet && this.currentBullet.active) {
      this.currentBullet.update()
    } else if (this.currentBullet && !this.currentBullet.active) {
      this.currentBullet = null
    }

    if (this.currentThread && this.currentThread.active) {
      this.currentThread.update()
    } else if (this.currentThread && !this.currentThread.active) {
      this.currentThread = null
    }

    if (this.cursors && this.body instanceof Phaser.Physics.Arcade.Body) {
      if (this.cursors.left?.isDown) {
        this.body.setVelocityX(-160)
      } else if (this.cursors.right?.isDown) {
        this.body.setVelocityX(160)
      }

      if (this.cursors.up?.isDown && this.body.touching.down) {
        this.body.setVelocityY(-330)
      }
    }
  }

  clearBullet() {
    this.currentBullet = null
    this.currentThread = null
  }

  setPosition(x: number, y: number): this {
    super.setPosition(x, y)
    return this
  }

  destroy(fromScene?: boolean) {
    this.scene.input.off('pointerdown', this.onMouseDown, this)
    this.scene.input.off('pointerup', this.onMouseUp, this)

    if (this.currentThread) {
      this.currentThread.destroy()
    }
    if (this.currentBullet) {
      this.currentBullet.destroy()
    }

    super.destroy(fromScene)
  }
}
