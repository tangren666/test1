import pygame

# 颜色定义
BROWN = (139, 69, 19)
GREEN = (0, 128, 0)

class Platform(pygame.sprite.Sprite):
    def __init__(self, x, y, width, height):
        super().__init__()
        self.image = pygame.Surface([width, height])
        self.image.fill(BROWN)
        self.rect = self.image.get_rect()
        self.rect.x = x
        self.rect.y = y

class Pipe(pygame.sprite.Sprite):
    def __init__(self, x, y):
        super().__init__()
        self.image = pygame.Surface([50, 100])
        self.image.fill(GREEN)
        self.rect = self.image.get_rect()
        self.rect.x = x
        self.rect.y = y

class Brick(pygame.sprite.Sprite):
    def __init__(self, x, y):
        super().__init__()
        self.image = pygame.Surface([30, 30])
        self.image.fill(BROWN)
        self.rect = self.image.get_rect()
        self.rect.x = x
        self.rect.y = y

class Enemy(pygame.sprite.Sprite):
    def __init__(self, x, y, enemy_type='mushroom'):
        super().__init__()
        self.enemy_type = enemy_type
        self.image = pygame.Surface([30, 30])
        self.image.fill((255, 0, 0))  # 红色表示敌人
        self.rect = self.image.get_rect()
        self.rect.x = x
        self.rect.y = y
        self.direction = 1  # 1表示向右移动，-1表示向左移动
        self.speed = 2

    def update(self):
        # 简单的左右移动AI
        self.rect.x += self.speed * self.direction
        
        # 如果碰到屏幕边界就改变方向
        if self.rect.left < 0:
            self.direction = 1
        elif self.rect.right > 800:  # 假设屏幕宽度为800
            self.direction = -1