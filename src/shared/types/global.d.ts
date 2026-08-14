declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            context?: string;
            ux_mode?: string;
            login_uri?: string;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: string;
              type?: string;
              text?: string;
              shape?: string;
              size?: string;
              width?: string;
              locale?: string;
              logo_alignment?: string;
            },
          ) => void;
        };
      };
    };
  }
}

export {};
