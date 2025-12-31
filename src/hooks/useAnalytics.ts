/**
 * useAnalytics Hook
 * React Hook для работы с Firebase Analytics
 */

import { useCallback, useEffect } from 'react';
import { firebaseAnalyticsService } from '../services/firebase';

/**
 * Хук для работы с аналитикой
 * Предоставляет методы для отслеживания событий, навигации, кликов и взаимодействий
 */
export const useAnalytics = () => {
  // Инициализация Firebase при монтировании компонента
  useEffect(() => {
    const initialized = firebaseAnalyticsService.initialize();
    if (initialized) {
      console.log('[Analytics] Firebase Analytics инициализирован');
    }
  }, []);

  /**
   * Отслеживание клика
   */
  const trackClick = useCallback((elementName: string, elementId?: string, elementType?: string) => {
    firebaseAnalyticsService.logEvent('click', {
      element_name: elementName,
      ...(elementId && { element_id: elementId }),
      ...(elementType && { element_type: elementType }),
    });
  }, []);

  /**
   * Отслеживание навигации
   */
  const trackNavigation = useCallback((from: string, to: string) => {
    firebaseAnalyticsService.logEvent('navigation', {
      from,
      to,
    });
  }, []);

  /**
   * Отслеживание взаимодействия с формой
   */
  const trackFormInteraction = useCallback((
    formName: string,
    action: 'submit' | 'cancel' | 'reset' | 'start',
    fieldsCount?: number
  ) => {
    firebaseAnalyticsService.logEvent('form_interaction', {
      form_name: formName,
      action,
      ...(fieldsCount !== undefined && { fields_count: fieldsCount }),
    });
  }, []);

  /**
   * Отслеживание фокуса на поле ввода
   */
  const trackInputFocus = useCallback((fieldName: string, formName?: string) => {
    firebaseAnalyticsService.logEvent('input_focus', {
      field_name: fieldName,
      ...(formName && { form_name: formName }),
    });
  }, []);

  /**
   * Отслеживание потери фокуса на поле ввода
   */
  const trackInputBlur = useCallback((fieldName: string, formName?: string) => {
    firebaseAnalyticsService.logEvent('input_blur', {
      field_name: fieldName,
      ...(formName && { form_name: formName }),
    });
  }, []);

  /**
   * Отслеживание просмотра экрана
   */
  const trackScreenView = useCallback((screenName: string, screenClass?: string) => {
    firebaseAnalyticsService.logScreenView(screenName, screenClass);
  }, []);

  /**
   * Отслеживание кастомного события
   */
  const trackEvent = useCallback((eventName: string, eventParams?: Record<string, any>) => {
    firebaseAnalyticsService.logEvent(eventName, eventParams);
  }, []);

  /**
   * Установка ID пользователя
   */
  const setUserId = useCallback((userId: string | null) => {
    firebaseAnalyticsService.setUserId(userId);
  }, []);

  /**
   * Установка свойства пользователя
   */
  const setUserProperty = useCallback((name: string, value: string) => {
    firebaseAnalyticsService.setUserProperty(name, value);
  }, []);

  /**
   * Включение/выключение аналитики
   */
  const setAnalyticsEnabled = useCallback((enabled: boolean) => {
    firebaseAnalyticsService.setAnalyticsCollectionEnabled(enabled);
  }, []);

  return {
    trackClick,
    trackNavigation,
    trackFormInteraction,
    trackInputFocus,
    trackInputBlur,
    trackScreenView,
    trackEvent,
    setUserId,
    setUserProperty,
    setAnalyticsEnabled,
  };
};

