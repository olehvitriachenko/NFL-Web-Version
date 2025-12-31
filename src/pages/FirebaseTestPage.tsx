/**
 * Firebase Test Page
 * Страница для тестирования всех функций Firebase Analytics
 */

import { useState } from 'react';
import { useAnalytics } from '../hooks/useAnalytics';
import { useNavigate } from '@tanstack/react-router';

export const FirebaseTestPage = () => {
  const analytics = useAnalytics();
  const navigate = useNavigate();
  const [testUserId, setTestUserId] = useState('');
  const [testUserProperty, setTestUserProperty] = useState({ name: '', value: '' });
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);

  const handleTrackClick = () => {
    analytics.trackClick('test-button', 'firebase-test-click', 'button');
    console.log('✅ Click event tracked');
  };

  const handleTrackNavigation = () => {
    analytics.trackNavigation('/firebase-test', '/home');
    console.log('✅ Navigation event tracked');
  };

  const handleTrackFormInteraction = (action: 'submit' | 'cancel' | 'reset' | 'start') => {
    analytics.trackFormInteraction('test-form', action, 5);
    console.log(`✅ Form interaction (${action}) tracked`);
  };

  const handleTrackInputFocus = () => {
    analytics.trackInputFocus('test-input', 'test-form');
    console.log('✅ Input focus tracked');
  };

  const handleTrackInputBlur = () => {
    analytics.trackInputBlur('test-input', 'test-form');
    console.log('✅ Input blur tracked');
  };

  const handleTrackScreenView = () => {
    analytics.trackScreenView('/firebase-test', 'test-page');
    console.log('✅ Screen view tracked');
  };

  const handleTrackCustomEvent = () => {
    analytics.trackEvent('test_custom_event', {
      test_param1: 'value1',
      test_param2: 123,
      test_param3: true,
    });
    console.log('✅ Custom event tracked');
  };

  const handleSetUserId = () => {
    if (testUserId) {
      analytics.setUserId(testUserId);
      console.log(`✅ User ID set: ${testUserId}`);
    } else {
      analytics.setUserId(null);
      console.log('✅ User ID cleared');
    }
  };

  const handleSetUserProperty = () => {
    if (testUserProperty.name && testUserProperty.value) {
      analytics.setUserProperty(testUserProperty.name, testUserProperty.value);
      console.log(`✅ User property set: ${testUserProperty.name} = ${testUserProperty.value}`);
    }
  };

  const handleToggleAnalytics = () => {
    const newValue = !analyticsEnabled;
    setAnalyticsEnabled(newValue);
    analytics.setAnalyticsEnabled(newValue);
    console.log(`✅ Analytics ${newValue ? 'enabled' : 'disabled'}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Firebase Analytics Test Page</h1>
        <p className="text-gray-600 mb-8">
          Эта страница позволяет протестировать все функции Firebase Analytics.
          Откройте консоль браузера (F12), чтобы увидеть логи событий.
        </p>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">📊 Basic Events</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleTrackClick}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Track Click
            </button>
            <button
              onClick={handleTrackNavigation}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Track Navigation
            </button>
            <button
              onClick={handleTrackScreenView}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Track Screen View
            </button>
            <button
              onClick={handleTrackCustomEvent}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Track Custom Event
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">📝 Form Events</h2>
          <div className="grid grid-cols-4 gap-4">
            <button
              onClick={() => handleTrackFormInteraction('start')}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Form Start
            </button>
            <button
              onClick={() => handleTrackFormInteraction('submit')}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Form Submit
            </button>
            <button
              onClick={() => handleTrackFormInteraction('cancel')}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Form Cancel
            </button>
            <button
              onClick={() => handleTrackFormInteraction('reset')}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Form Reset
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <button
              onFocus={handleTrackInputFocus}
              className="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Focus me (Track Focus)
            </button>
            <button
              onBlur={handleTrackInputBlur}
              className="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Blur me (Track Blur)
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">👤 User Properties</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">User ID</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={testUserId}
                  onChange={(e) => setTestUserId(e.target.value)}
                  placeholder="Enter user ID"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded"
                />
                <button
                  onClick={handleSetUserId}
                  className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
                >
                  Set User ID
                </button>
                <button
                  onClick={() => {
                    setTestUserId('');
                    analytics.setUserId(null);
                    console.log('✅ User ID cleared');
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Clear
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">User Property</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={testUserProperty.name}
                  onChange={(e) =>
                    setTestUserProperty({ ...testUserProperty, name: e.target.value })
                  }
                  placeholder="Property name"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded"
                />
                <input
                  type="text"
                  value={testUserProperty.value}
                  onChange={(e) =>
                    setTestUserProperty({ ...testUserProperty, value: e.target.value })
                  }
                  placeholder="Property value"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded"
                />
                <button
                  onClick={handleSetUserProperty}
                  className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
                >
                  Set Property
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">⚙️ Settings</h2>
          <button
            onClick={handleToggleAnalytics}
            className={`px-4 py-2 rounded ${
              analyticsEnabled
                ? 'bg-green-500 hover:bg-green-600'
                : 'bg-red-500 hover:bg-red-600'
            } text-white`}
          >
            {analyticsEnabled ? '✅ Analytics Enabled' : '❌ Analytics Disabled'}
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-2">💡 Инструкции</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
            <li>Откройте консоль браузера (F12) для просмотра логов</li>
            <li>Все события также будут отправлены в Firebase (если настроено)</li>
            <li>Проверьте Firebase DebugView для просмотра событий в реальном времени</li>
            <li>Навигация автоматически отслеживается при переходе между страницами</li>
          </ul>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => navigate({ to: '/home' })}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

