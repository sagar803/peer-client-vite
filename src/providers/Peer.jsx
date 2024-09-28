//@ts-nocheck
import { createContext, useContext, useMemo, useCallback } from "react";

const peerContext = createContext(null);

export const PeerProvider = ({ children }) => {
  const peer = useMemo(
    () =>
      new RTCPeerConnection({
        iceServers: [
          {
            urls: [
              "stun:stun.l.google.com:19302",
              "stun:global.stun.twilio.com:3478",
            ],
          },
        ],
      }),
    []
  );

  const createOffer = useCallback(async () => {
    const offer = await peer.createOffer();
    await peer.setLocalDescription(new RTCSessionDescription(offer));
    return offer;
  }, [peer]);

  const createAnswer = useCallback(
    async (offer) => {
      await peer.setRemoteDescription(offer);
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(new RTCSessionDescription(answer));
      return answer;
    },
    [peer]
  );

  const closeConnection = useCallback(() => {
    peer.close();
  }, [peer]);

  return (
    <peerContext.Provider
      value={{ peer, createOffer, createAnswer, closeConnection }}
    >
      {children}
    </peerContext.Provider>
  );
};

export default function usePeer() {
  return useContext(peerContext);
}
