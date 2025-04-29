import { useEffect, useRef, useState } from 'react';
import  io from 'socket.io-client';
import { Photo } from '../types';
import { Socket } from 'dgram';

interface WebSocketMessage {
  type?: 'welcome' | 'photo';
  message?: string;
  phone?: string;
  user?: string;
  text?: string;
  image?: string;
  createdAt?: number;
}

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const [newPhoto, setNewPhoto] = useState<Photo | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const maxReconnectAttempts = 5;
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [isReconnecting, setIsReconnecting] = useState(false);

  

  const cleanup = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };

  const connectSocket = () => {
    if (socketRef.current?.connected || reconnectAttempts >= maxReconnectAttempts) {
      if (reconnectAttempts >= maxReconnectAttempts) {
        console.log('Maximum number of reconnection attempts reached');
        setError('Maximum number of reconnection attempts reached');
        setIsReconnecting(false);
      }
      return;
    }

    try {
      const deploy = "https://events-backend-bot-app-production.up.railway.app"
      const local = "http://localhost:5001";
      

      console.log('Attempting Socket.IO connection to:', deploy);

      const token = process.env.NEXT_PUBLIC_BACKEND_SOCKET_TOKEN;
      if (!token) {
        throw new Error('Authentication token not found in environment variables');
      }

      const socket = io(deploy, {
        reconnection: false,
        timeout: 5000,
        transports: ['websocket', 'polling'],
        auth: {
          token: `Bearer ${token}`
        },
        extraHeaders: {
          Authorization: `Bearer ${token}`
        }
      });

      socketRef.current = socket;

      socket.onAny((eventName, ...args) => {
        console.log('Received event:', eventName, 'with data:', args);
      });

      socket.on('connect', () => {
        console.log('Socket.IO connection established');
        setIsConnected(true);
        setError(null);
        setReconnectAttempts(0);
        setIsReconnecting(false);
      });

      socket.on('welcome', (data: WebSocketMessage) => {
        console.log('Welcome message received:', data);
      });

      socket.on('message', (data: any) => {
        console.log('Generic message received:', data);
        try {
          if (typeof data === 'string') {
            const parsedData = JSON.parse(data);
            handleIncomingData(parsedData);
          } else {
            handleIncomingData(data);
          }
        } catch (err) {
          console.error('Error processing message data:', err);
        }
      });

      socket.on('photo', (data: WebSocketMessage) => {
        console.log('Photo event received:', data);
        handleIncomingData(data);
      });

      socket.on('realTimeData', (data: any) => {
        console.log('realTimeData event received:', data);
        handleIncomingData(data);
      });

      socket.on('connect_error', (error) => {
        console.error('Socket.IO connection error:', error);
        setError(`Connection error: ${error.message}`);
        setIsConnected(false);
        handleReconnect();
      });

      socket.on('disconnect', (reason) => {
        console.log('Socket.IO connection closed:', reason);
        setIsConnected(false);
        
        if (reason === 'io server disconnect' || reason === 'io client disconnect') {
          return;
        }
        
        handleReconnect();
      });

    } catch (err) {
      console.error('Error creating Socket.IO connection:', err);
      setError(`Error creating connection: ${err.message}`);
      setIsConnected(false);
      handleReconnect();
    }
  };

  const handleIncomingData = (data: any) => {
    try {
      if (data.image && data.user) {
        const photo: Photo = {
          id: Date.now().toString(),
          url: data.image,
          author: data.user,
          message: data.text || '',
          timestamp: data.createdAt || Date.now(),
          profilePic: data.imgProfile || ''
        };
        console.log('Setting new photo:', photo);
        setNewPhoto(photo);
      } else if (data.evento && data.imagen_url) {
        const photo: Photo = {
          id: Date.now().toString(),
          url: data.imagen_url,
          author: data.evento,
          message: data.descripcion || '',
          timestamp: Date.now(),
          profilePic: ''
        };
        console.log('Setting new photo from realTimeData:', photo);
        setNewPhoto(photo);
      }
    } catch (err) {
      console.error('Error processing incoming data:', err);
    }
  };

  const handleReconnect = () => {
    if (isReconnecting || socketRef.current?.connected) {
      return;
    }

    if (reconnectAttempts < maxReconnectAttempts) {
      setIsReconnecting(true);
      setReconnectAttempts(prev => prev + 1);
      console.log(`Reconnection attempt ${reconnectAttempts + 1} of ${maxReconnectAttempts}`);
      
      reconnectTimeoutRef.current = setTimeout(() => {
        connectSocket();
      }, 5000);
    }
  };

  useEffect(() => {
    connectSocket();
    return cleanup;
  }, []);

  return {
    isConnected,
    error,
    newPhoto,
    setNewPhoto,
    socket: socketRef.current
  };
}