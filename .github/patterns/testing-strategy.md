# Testing Strategy - Hell's December

**Data de Criação:** 29/10/2025

---

## 🎯 COBERTURA DE TESTES

### Mínimos Obrigatórios
- **Backend:** 80% code coverage
- **Frontend:** 70% code coverage (componentes críticos 90%)
- **Database:** 100% stored procedures testadas
- **WebSocket:** 75% event handlers testados
- **Game Logic:** 85% systems críticos testados

---

## 🔧 BACKEND TESTING (NestJS)

### Unit Tests
```typescript
// users.service.spec.ts
import { Test } from '@nestjs/testing';
import { UsersService } from './users.service';
import { Argon2Service } from '@/core/security/argon2.service';

describe('UsersService', () => {
  let service: UsersService;
  let argon2Service: Argon2Service;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: Argon2Service,
          useValue: {
            hashPassword: jest.fn().mockResolvedValue('hashed'),
            verifyPassword: jest.fn().mockResolvedValue(true)
          }
        }
      ]
    }).compile();

    service = module.get<UsersService>(UsersService);
    argon2Service = module.get<Argon2Service>(Argon2Service);
  });

  it('should hash password on user creation', async () => {
    const user = await service.create({
      email: 'test@test.com',
      password: 'Password123!',
      username: 'testuser'
    });

    expect(argon2Service.hashPassword).toHaveBeenCalledWith('Password123!');
  });
});
```

### Integration Tests
```typescript
// auth.e2e-spec.ts
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

describe('Authentication (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // Setup app
  });

  it('/auth/login (POST) should return JWT token', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@test.com', password: 'Password123!' })
      .expect(200)
      .expect((res) => {
        expect(res.body.token).toBeDefined();
      });
  });
});
```

---

## 🎨 FRONTEND TESTING (Vue.js 3)

### Component Unit Tests (Vitest + Vue Test Utils)
```typescript
// Button.spec.ts
import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import HDButton from './Button.vue';

describe('HDButton', () => {
  it('renders slot content', () => {
    const wrapper = mount(HDButton, {
      slots: {
        default: 'Click me'
      }
    });

    expect(wrapper.text()).toContain('Click me');
  });

  it('emits click event when clicked', async () => {
    const wrapper = mount(HDButton);
    
    await wrapper.trigger('click');
    
    expect(wrapper.emitted('click')).toBeTruthy();
  });

  it('does not emit click when disabled', async () => {
    const wrapper = mount(HDButton, {
      props: { disabled: true }
    });

    await wrapper.trigger('click');

    expect(wrapper.emitted('click')).toBeFalsy();
  });
});
```

### Store Tests (Pinia)
```typescript
// auth.store.spec.ts
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from './auth.store';

describe('Auth Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should set user on login', async () => {
    const store = useAuthStore();

    await store.login('test@test.com', 'password');

    expect(store.isAuthenticated).toBe(true);
    expect(store.user).toBeDefined();
  });

  it('should clear user on logout', async () => {
    const store = useAuthStore();
    
    await store.login('test@test.com', 'password');
    await store.logout();

    expect(store.isAuthenticated).toBe(false);
    expect(store.user).toBeNull();
  });
});
```

### E2E Tests (Playwright/Cypress)
```typescript
// login.e2e.spec.ts
import { test, expect } from '@playwright/test';

test('user can login successfully', async ({ page }) => {
  await page.goto('http://localhost:5173/login');

  await page.fill('[data-test="email"]', 'test@test.com');
  await page.fill('[data-test="password"]', 'Password123!');
  await page.click('[data-test="submit"]');

  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('[data-test="username"]')).toContainText('testuser');
});
```

---

## 🗄️ DATABASE TESTING (MySQL)

### Stored Procedures Tests
```sql
-- Test sp_get_player_full_data
DELIMITER $$

CREATE PROCEDURE test_sp_get_player_full_data()
BEGIN
  DECLARE test_user_id VARCHAR(36);
  DECLARE test_player_id VARCHAR(36);
  
  -- Setup
  INSERT INTO users (id, email, password_hash, username)
  VALUES (UUID(), 'test@test.com', 'hash', 'testuser');
  
  SET test_user_id = LAST_INSERT_ID();
  
  INSERT INTO players (id, user_id, name, position_x, position_y)
  VALUES (UUID(), test_user_id, 'Test Player', 10.0, 20.0);
  
  SET test_player_id = LAST_INSERT_ID();
  
  -- Execute
  CALL sp_get_player_full_data(test_player_id);
  
  -- Assert (check results manually or use testing framework)
  
  -- Cleanup
  DELETE FROM players WHERE id = test_player_id;
  DELETE FROM users WHERE id = test_user_id;
END$$

DELIMITER ;
```

---

## 🌐 WEBSOCKET TESTING

### Connection Tests
```typescript
// websocket.spec.ts
import { WebSocket } from 'ws';

describe('WebSocket Server', () => {
  let ws: WebSocket;

  beforeAll((done) => {
    ws = new WebSocket('ws://localhost:3004?token=valid-jwt-token');
    ws.on('open', done);
  });

  it('should connect successfully with valid token', () => {
    expect(ws.readyState).toBe(WebSocket.OPEN);
  });

  it('should receive player:moved event', (done) => {
    ws.on('message', (data) => {
      const message = JSON.parse(data.toString());
      
      if (message.type === 'player:moved') {
        expect(message.data.playerId).toBeDefined();
        done();
      }
    });

    // Trigger movement
    ws.send(JSON.stringify({
      type: 'player:move',
      data: { x: 100, y: 200 }
    }));
  });
});
```

---

## 🎮 GAME LOGIC TESTING (ECS)

### System Tests
```typescript
// MovementSystem.spec.ts
import { createWorld, addEntity, addComponent } from 'bitecs';
import { Position, Velocity } from '../components';
import { createMovementSystem } from '../systems/MovementSystem';

describe('MovementSystem', () => {
  it('should update entity position based on velocity', () => {
    const world = createWorld();
    const eid = addEntity(world);

    addComponent(world, Position, eid);
    addComponent(world, Velocity, eid);

    Position.x[eid] = 0;
    Position.y[eid] = 0;
    Velocity.x[eid] = 10;
    Velocity.y[eid] = 5;

    world.time = { delta: 1000, elapsed: 0, then: 0 };

    const system = createMovementSystem();
    system(world);

    expect(Position.x[eid]).toBe(10);
    expect(Position.y[eid]).toBe(5);
  });
});
```

---

## 📊 PERFORMANCE TESTING

### Load Tests (k6)
```javascript
// load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100
    { duration: '2m', target: 0 },    // Ramp down
  ],
};

export default function () {
  const res = http.get('http://localhost:3003/api/v1/health');
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
```

---

## ✅ CHECKLIST DE TESTES

### Antes de cada commit:
- [ ] Rodar testes unitários localmente
- [ ] Verificar code coverage
- [ ] Linter sem erros
- [ ] Build sem warnings

### Antes de cada PR:
- [ ] Testes E2E passando
- [ ] Performance tests executados
- [ ] Stored procedures testadas
- [ ] WebSocket handlers testados
- [ ] Coverage >= mínimo

### Antes de deploy:
- [ ] Todos os testes CI/CD passando
- [ ] Load tests executados
- [ ] Smoke tests em staging
- [ ] Rollback plan testado

---

**Última atualização:** 29/10/2025
