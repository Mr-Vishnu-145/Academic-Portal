import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

/**
 * useStaffUpdates — subscribes to /topic/staff-updates via STOMP/SockJS.
 * Calls onMessage(payload) whenever a staff update event is received.
 *
 * @param {function} onMessage  callback({ type, staffId, staffName, newDeptCode, newDeptName })
 */
const useStaffUpdates = (onMessage) => {
  const clientRef = useRef(null);

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe('/topic/staff-updates', (frame) => {
          try {
            const payload = JSON.parse(frame.body);
            if (onMessage) onMessage(payload);
          } catch (e) {
            console.error('WS parse error', e);
          }
        });
      },
      onStompError: (frame) => {
        console.warn('STOMP error', frame);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
};

export default useStaffUpdates;
