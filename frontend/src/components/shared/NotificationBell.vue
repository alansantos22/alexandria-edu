<template>
  <div class="bell" @click="open = !open">
    <span class="icon">🔔</span>
    <span v-if="store.unread > 0" class="badge">{{ store.unread }}</span>
    <div v-if="open" class="dropdown" @click.stop>
      <div class="head">
        <strong>Notificações</strong>
        <button v-if="store.unread > 0" @click="store.markAllRead()">Marcar todas</button>
      </div>
      <ul>
        <li v-if="!store.items.length" class="empty">Nenhuma notificação.</li>
        <li v-for="n in store.items" :key="n.id" :class="{ unread: !n.readAt }" @click="open=false; n.link && $router.push(n.link); store.markRead(n.id)">
          <strong>{{ n.title }}</strong>
          <p>{{ n.body }}</p>
          <small>{{ fmt(n.createdAt) }}</small>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { notificationsStore } from '../../core/store/notifications.js'

const store = notificationsStore
const open = ref(false)

onMounted(() => store.startPolling())
onUnmounted(() => store.stopPolling())

function fmt(d) {
  if (!d) return ''
  return new Date(d).toLocaleString('pt-BR')
}
</script>

<style lang="scss" scoped>
.bell {
  position: relative;
  cursor: pointer;
  .icon { font-size: 1.3rem; }
  .badge {
    position: absolute; top: -6px; right: -10px;
    background: #ff5252; color: white;
    border-radius: 10px; padding: 1px 6px;
    font-size: 0.7rem; font-weight: 700;
  }
  .dropdown {
    position: absolute; top: 28px; right: 0;
    width: 320px; max-height: 420px; overflow-y: auto;
    background: white; border-radius: 8px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.15);
    z-index: 100;
    .head { padding: 12px 14px; display: flex; justify-content: space-between; border-bottom: 1px solid #eee;
      button { font-size: 0.8rem; background: none; border: none; color: #2c7be5; cursor: pointer; }
    }
    ul { list-style: none; padding: 0; margin: 0;
      li { padding: 10px 14px; border-bottom: 1px solid #f0f0f0; cursor: pointer;
        &:hover { background: #f7f9fc; }
        &.unread { background: #eef5ff; }
        strong { display: block; font-size: 0.9rem; }
        p { font-size: 0.82rem; color: #555; margin: 2px 0 4px; }
        small { font-size: 0.7rem; color: #999; }
      }
      .empty { padding: 18px; text-align: center; color: #999; }
    }
  }
}
</style>
