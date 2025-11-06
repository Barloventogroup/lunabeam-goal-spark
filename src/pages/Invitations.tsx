import { useEffect } from "react";
import { TabInvitations } from "../components/navigation/tab-invitations";

export default function Invitations() {
  useEffect(() => {
    document.title = "Invitations | Lunabeam";
    // Meta description
    let metaDesc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.setAttribute("name", "description");
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute("content", "Manage your Lunabeam invitations: view, accept, or decline.");

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", window.location.origin + "/invitations");
  }, []);

  return <TabInvitations />;
}