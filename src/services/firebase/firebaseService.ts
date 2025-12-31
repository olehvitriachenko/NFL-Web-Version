/**
 * Firebase Analytics Service
 * Сервисный слой для работы с Firebase Analytics
 */

import { getAnalytics, logEvent, setUserId, setUserProperties } from 'firebase/analytics';
import { initializeApp, getApps } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { getFirebaseConfig } from '../../config/firebase';

// Проверка, является ли платформа Windows (Electron может работать на Windows)
const isWindows = typeof window !== 'undefined' && navigator.platform.toLowerCase().includes('win');
// Проверка, является ли окружение Electron
const isElectron = typeof window !== 'undefined' && window.location.protocol === 'file:';

/**
 * Класс для работы с Firebase Analytics
 */
class FirebaseAnalyticsService {
  private app: FirebaseApp | null = null;
  // Используем any для типа Analytics, так как он не экспортируется напрямую
  // Тип будет автоматически выведен из getAnalytics()
  private analytics: any = null;
  private isInitialized = false;
  private analyticsEnabled = true;

  /**
   * Инициализация Firebase
   */
  initialize(): boolean {
    // Проверяем, не инициализирован ли уже Firebase
    const existingApps = getApps();
    if (existingApps.length > 0) {
      this.app = existingApps[0];
    } else {
      const config = getFirebaseConfig();
      if (!config) {
        console.warn('[Firebase] Конфигурация не найдена. Analytics будет отключен.');
        return false;
      }

      try {
        this.app = initializeApp(config);
        this.isInitialized = true;
      } catch (error) {
        console.error('[Firebase] Ошибка инициализации:', error);
        return false;
      }
    }

    // Инициализация Analytics
    // Firebase Analytics работает в браузере и Electron (через Chromium)
    if (typeof window !== 'undefined') {
      try {
        this.analytics = getAnalytics(this.app);
        this.isInitialized = true;
        if (isElectron) {
          console.log('[Firebase] Analytics инициализирован в Electron режиме');
        }
      } catch (error) {
        console.warn('[Firebase] Analytics не может быть инициализирован:', error);
        // Fallback на console для отладки
        console.log('[Firebase] Используется fallback режим (console.log)');
      }
    }

    return this.isInitialized;
  }

  /**
   * Проверка инициализации
   */
  private checkInitialization(): boolean {
    if (!this.isInitialized || !this.app) {
      console.warn('[Firebase] Сервис не инициализирован. Вызовите initialize() сначала.');
      return false;
    }
    return true;
  }

  /**
   * Валидация имени события по требованиям Firebase
   * - Максимум 40 символов
   * - Только буквы, цифры и подчеркивания
   * - Не может начинаться с цифры
   */
  private validateEventName(eventName: string): boolean {
    if (!eventName || eventName.length === 0) {
      console.error('[Firebase] Имя события не может быть пустым');
      return false;
    }
    if (eventName.length > 40) {
      console.error('[Firebase] Имя события не может быть длиннее 40 символов:', eventName);
      return false;
    }
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(eventName)) {
      console.error('[Firebase] Имя события может содержать только буквы, цифры и подчеркивания, и не может начинаться с цифры:', eventName);
      return false;
    }
    return true;
  }

  /**
   * Валидация параметров события
   * - Максимум 40 символов для имени параметра
   * - Только буквы, цифры и подчеркивания
   * - Значение может быть строкой, числом или boolean
   */
  private validateEventParams(params: Record<string, any>): Record<string, any> | null {
    const validatedParams: Record<string, any> = {};

    for (const [key, value] of Object.entries(params)) {
      if (!this.validateEventName(key)) {
        return null;
      }

      // Firebase принимает только строки, числа и boolean
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        // Для строк ограничиваем длину до 100 символов
        if (typeof value === 'string' && value.length > 100) {
          console.warn(`[Firebase] Параметр ${key} обрезан до 100 символов`);
          validatedParams[key] = value.substring(0, 100);
        } else {
          validatedParams[key] = value;
        }
      } else {
        console.warn(`[Firebase] Параметр ${key} имеет неподдерживаемый тип. Преобразован в строку.`);
        validatedParams[key] = String(value);
      }
    }

    return validatedParams;
  }

  /**
   * Нормализация имени экрана для Firebase
   * Преобразует путь (например "/" или "/home") в валидное имя события
   */
  private normalizeScreenName(screenName: string): string {
    // Убираем начальный и конечный слеш
    let normalized = screenName.replace(/^\/+|\/+$/g, '');
    
    // Если путь пустой (был "/"), используем "home"
    if (!normalized || normalized === '') {
      normalized = 'home';
    }
    
    // Заменяем слеши на подчеркивания
    normalized = normalized.replace(/\//g, '_');
    
    // Убираем недопустимые символы, оставляем только буквы, цифры и подчеркивания
    normalized = normalized.replace(/[^a-zA-Z0-9_]/g, '_');
    
    // Убираем множественные подчеркивания
    normalized = normalized.replace(/_+/g, '_');
    
    // Убираем начальное и конечное подчеркивание
    normalized = normalized.replace(/^_+|_+$/g, '');
    
    // Если имя все еще пустое, используем "home"
    if (!normalized) {
      normalized = 'home';
    }
    
    // Ограничиваем длину до 40 символов
    if (normalized.length > 40) {
      normalized = normalized.substring(0, 40);
    }
    
    return normalized;
  }

  /**
   * Логирование просмотра экрана
   */
  logScreenView(screenName: string, screenClass?: string): void {
    if (!this.analyticsEnabled) return;

    // Нормализуем имя экрана для Firebase
    const normalizedName = this.normalizeScreenName(screenName);
    
    // Валидируем нормализованное имя
    if (!this.validateEventName(normalizedName)) {
      console.warn(`[Firebase] Невозможно нормализовать имя экрана: ${screenName}`);
      return;
    }

    const params: Record<string, any> = {
      screen_name: screenName, // Оригинальное имя сохраняем в параметрах
    };

    if (screenClass) {
      params.screen_class = screenClass;
    }

    // Используем нормализованное имя для события screen_view
    // Но в Firebase Analytics используется стандартное событие screen_view,
    // и screen_name передается как параметр, а не как имя события
    // Поэтому просто логируем событие screen_view с параметрами
    this.logEvent('screen_view', params);
  }

  /**
   * Логирование события
   */
  logEvent(eventName: string, eventParams?: Record<string, any>): void {
    if (!this.analyticsEnabled) return;

    if (!this.validateEventName(eventName)) {
      return;
    }

    // Валидация параметров
    let validatedParams: Record<string, any> | undefined;
    if (eventParams) {
      const validated = this.validateEventParams(eventParams);
      if (validated === null) {
        return; // Ошибка валидации
      }
      validatedParams = validated;
    }

    // Если Analytics не доступен, используем fallback
    if (!this.analytics) {
      if (isWindows || isElectron) {
        console.log(`[Firebase Analytics] Event: ${eventName}`, validatedParams || {});
      } else {
        console.warn('[Firebase] Analytics не инициализирован');
      }
      return;
    }

    try {
      logEvent(this.analytics, eventName, validatedParams);
    } catch (error) {
      console.error('[Firebase] Ошибка при логировании события:', error);
    }
  }

  /**
   * Установка свойства пользователя
   */
  setUserProperty(name: string, value: string): void {
    if (!this.analyticsEnabled) return;

    if (!this.checkInitialization() || !this.analytics) {
      return;
    }

    if (!this.validateEventName(name)) {
      return;
    }

    if (value && value.length > 36) {
      console.warn('[Firebase] Значение свойства пользователя обрезано до 36 символов');
      value = value.substring(0, 36);
    }

    try {
      setUserProperties(this.analytics, {
        [name]: value,
      });
    } catch (error) {
      console.error('[Firebase] Ошибка при установке свойства пользователя:', error);
    }
  }

  /**
   * Установка ID пользователя
   */
  setUserId(userId: string | null): void {
    if (!this.checkInitialization() || !this.analytics) {
      return;
    }

    try {
      setUserId(this.analytics, userId);
    } catch (error) {
      console.error('[Firebase] Ошибка при установке ID пользователя:', error);
    }
  }

  /**
   * Включение/выключение сбора аналитики
   */
  setAnalyticsCollectionEnabled(enabled: boolean): void {
    this.analyticsEnabled = enabled;
    if (!enabled) {
      console.log('[Firebase] Сбор аналитики отключен');
    }
  }

  /**
   * Сброс данных аналитики (для тестирования)
   */
  resetAnalyticsData(): void {
    if (!this.checkInitialization() || !this.analytics) {
      return;
    }

    // В веб-версии Firebase нет прямого метода сброса, но можно очистить ID пользователя
    try {
      setUserId(this.analytics, null);
      setUserProperties(this.analytics, {});
      console.log('[Firebase] Данные аналитики сброшены');
    } catch (error) {
      console.error('[Firebase] Ошибка при сбросе данных:', error);
    }
  }

  /**
   * Получение статуса инициализации
   */
  getInitializationStatus(): boolean {
    return this.isInitialized && this.app !== null;
  }
}

// Экспорт singleton экземпляра
export const firebaseAnalyticsService = new FirebaseAnalyticsService();

