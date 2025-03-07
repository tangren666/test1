import pygame
import sys
from game_objects import Platform, Pipe, Brick, Enemy

# 初始化Pygame
pygame.init()

# 游戏窗口设置
WINDOW_WIDTH = 800
WINDOW_HEIGHT = 600
FPS = 60

# 颜色定义
WHITE = (255, 255, 255)
BLUE = (0, 0, 255)
BROWN = (139, 69, 19)

# 创建游戏窗口
screen = pygame.display.set_mode((WINDOW_WIDTH, WINDOW_HEIGHT))
pygame.display.set_caption('超级玛丽')

# 游戏时钟
clock = pygame.time.Clock()

class Player(pygame.sprite.Sprite):
    def __init__(self):
        super().__init__()
        # 加载玩家图片并调整大小
        original_image = pygame.image.load('player.jpg').convert_alpha()
        self.image = pygame.transform.scale(original_image, (30, 60))
        self.rect = self.image.get_rect()
        self.rect.x = 100
        self.rect.y = WINDOW_HEIGHT - 100
        self.velocity_y = 0
        self.jumping = False
        self.crouching = False

    def update(self):
        # 重力
        self.velocity_y += 0.8
        self.rect.y += self.velocity_y

        # 防止角色掉出屏幕底部
        if self.rect.bottom > WINDOW_HEIGHT:
            self.rect.bottom = WINDOW_HEIGHT
            self.velocity_y = 0
            self.jumping = False

        # 获取按键状态
        keys = pygame.key.get_pressed()
        
        # 左右移动
        if keys[pygame.K_LEFT]:
            self.rect.x -= 5
        if keys[pygame.K_RIGHT]:
            self.rect.x += 5

        # 跳跃
        if (keys[pygame.K_SPACE] or keys[pygame.K_UP]) and not self.jumping:
            self.velocity_y = -15
            self.jumping = True

        # 下蹲
        if keys[pygame.K_DOWN] and not self.jumping:
            if not self.crouching:
                self.crouching = True
                self.rect.height = 30
                self.rect.y += 30
        elif self.crouching:
            self.crouching = False
            self.rect.height = 60
            self.rect.y -= 30

        # 确保角色不会移出屏幕
        if self.rect.left < 0:
            self.rect.left = 0
        if self.rect.right > WINDOW_WIDTH:
            self.rect.right = WINDOW_WIDTH

# 创建精灵组
all_sprites = pygame.sprite.Group()
platforms = pygame.sprite.Group()
enemies = pygame.sprite.Group()

# 创建玩家
player = Player()
all_sprites.add(player)

# 创建平台
ground = Platform(0, WINDOW_HEIGHT - 40, WINDOW_WIDTH, 40)
platform1 = Platform(300, 400, 200, 20)
platform2 = Platform(100, 300, 200, 20)
platform3 = Platform(500, 200, 200, 20)

# 添加平台到精灵组
for platform in [ground, platform1, platform2, platform3]:
    all_sprites.add(platform)
    platforms.add(platform)

# 创建管道
pipe1 = Pipe(600, WINDOW_HEIGHT - 140)
all_sprites.add(pipe1)
platforms.add(pipe1)

# 创建敌人
enemy1 = Enemy(400, WINDOW_HEIGHT - 70)
enemy2 = Enemy(200, WINDOW_HEIGHT - 70)
for enemy in [enemy1, enemy2]:
    all_sprites.add(enemy)
    enemies.add(enemy)

# 游戏主循环
running = True
while running:
    # 事件处理
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False

    # 更新
    all_sprites.update()
    
    # 检测与平台的碰撞
    if player.velocity_y > 0:
        hits = pygame.sprite.spritecollide(player, platforms, False)
        if hits:
            player.rect.bottom = hits[0].rect.top
            player.velocity_y = 0
            player.jumping = False
    
    # 检测与敌人的碰撞
    enemy_hits = pygame.sprite.spritecollide(player, enemies, False)
    if enemy_hits:
        # 如果从上方踩到敌人
        if player.velocity_y > 0 and player.rect.bottom < enemy_hits[0].rect.centery:
            enemy_hits[0].kill()
        else:
            # 游戏结束
            running = False

    # 渲染
    screen.fill(WHITE)
    all_sprites.draw(screen)
    
    # 刷新屏幕
    pygame.display.flip()
    
    # 控制游戏帧率
    clock.tick(FPS)

# 退出游戏
pygame.quit()
sys.exit()