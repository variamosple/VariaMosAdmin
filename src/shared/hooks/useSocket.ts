import { useCallback, useEffect, useRef, useState } from "react";

export type SocketFunction = () => WebSocket;

export const useSocket = (socketFunction: SocketFunction, connectOnMount: Boolean = false) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    let socketConnection;
    try {
      socketConnection = socketFunction();
      socketRef.current = socketConnection;
      setSocket(socketConnection);
    } catch (e) {
      console.error(e);
    }

    return socketConnection;
  }, [socketFunction]);

  useEffect(() => {
    if (!connectOnMount) {
      return;
    }

    connect();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      setSocket(null);
    };
  }, [connect, connectOnMount]);

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      setSocket(null);
    };
  }, []);

  return { socket, connect };
};
