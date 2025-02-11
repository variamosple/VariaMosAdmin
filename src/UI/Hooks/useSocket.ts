import { useCallback, useEffect, useState } from "react";

export type SocketFunction = () => WebSocket;

export const useSocket = (
  socketFunction: SocketFunction,
  connectOnMounth: Boolean = false
) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);

  const connect = useCallback(() => {
    let socketConnection;
    try {
      socketConnection = socketFunction();
      setSocket(socketConnection);
    } catch (e) {
      console.error(e);
    }

    return socketConnection;
  }, [socketFunction]);

  useEffect(() => {
    if (!connectOnMounth) {
      return;
    }

    connect();

    return () => {
      setSocket((currentSocket) => {
        if (currentSocket) {
          currentSocket.close();
        }

        return null;
      });
    };
  }, [connect, connectOnMounth]);

  useEffect(() => {
    return () => {
      setSocket((currentSocket) => {
        if (currentSocket) {
          currentSocket.close();
        }

        return null;
      });
    };
  }, []);

  return { socket, connect };
};
