import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import {
  ArrowLeft,
  Edit,
  Plus,
  X,
  Save,
  Camera,
  Check,
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Capacitor } from '@capacitor/core';
import { pickAvatarBlob } from '@/utils/mediaPicker';
import type { Profile } from "@/types";
interface ProfileViewProps {
  onBack: () => void;
}
export const ProfileView: React.FC<ProfileViewProps> = ({ onBack }) => {
  const { profile, setProfile } = useStore();
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editedData, setEditedData] = useState<any>({});
  const [newTag, setNewTag] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleStartEdit = (section: string) => {
    setEditingSection(section);
    if (section === "basic") {
      setEditedData({
        first_name: profile?.first_name || "",
        email: profile?.email || "",
      });
    } else if (section === "password") {
      setEditedData({
        newPassword: "",
        confirmPassword: "",
      });
    } else if (section === "tags") {
      setEditedData({
        strengths: profile?.strengths || [],
        interests: profile?.interests || [],
        challenges: profile?.challenges || [],
      });
    }
  };
  const handleSave = async (section: string) => {
    try {
      if (!profile) return;
      if (section === "password") {
        // Validate passwords
        if (!editedData.newPassword || editedData.newPassword.length < 6) {
          toast({
            title: "Error",
            description: "Password must be at least 6 characters long.",
            variant: "destructive",
          });
          return;
        }
        if (editedData.newPassword !== editedData.confirmPassword) {
          toast({
            title: "Error",
            description: "Passwords do not match.",
            variant: "destructive",
          });
          return;
        }

        // Update password using Supabase Auth
        const { error } = await supabase.auth.updateUser({
          password: editedData.newPassword,
        });
        if (error) throw error;
        setEditingSection(null);
        setEditedData({});
        toast({
          title: "Password updated",
          description: "Your password has been changed successfully.",
        });
        return;
      }
      const { data, error } = await supabase
        .from("profiles")
        .update(editedData)
        .eq("user_id", profile.user_id)
        .select()
        .single();
      if (error) throw error;
      setProfile({
        ...profile,
        ...editedData,
      });
      setEditingSection(null);
      setEditedData({});
      toast({
        title: "Profile updated",
        description: "Your changes have been saved.",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };
  const handleCancel = () => {
    setEditingSection(null);
    setEditedData({});
    setNewTag("");
  };
  const handleAvatarBlobUpload = async (blob: Blob, ext: string, contentType?: string) => {
    if (!profile) return;

    try {
      setUploading(true);

      // Get authenticated user ID
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Not authenticated');
      }
      const userId = user.id;

      // Validate file size (max 5MB)
      if (blob.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Image must be smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }

      // Validate file type
      const lowerExt = ext.toLowerCase();
      if (!["jpg", "jpeg", "png", "webp", "gif"].includes(lowerExt)) {
        toast({
          title: "Invalid file type",
          description: "Please use JPG, PNG, WEBP, or GIF",
          variant: "destructive",
        });
        return;
      }

      const inferredMime = contentType ?? (
        lowerExt === 'png' ? 'image/png' : 
        lowerExt === 'webp' ? 'image/webp' : 
        lowerExt === 'gif' ? 'image/gif' : 
        'image/jpeg'
      );

      // Upload file to Supabase Storage using authenticated user ID
      const fileName = `${userId}/avatar.${ext}`;
      console.log('Avatar upload starting', { userId, fileName, size: blob.size, ext, inferredMime });
      
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, blob, {
          upsert: true,
          contentType: inferredMime,
        });
      
      if (uploadError) throw uploadError;
      console.log('Avatar upload success', { fileName });

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      const cleanUrl = publicUrl.split('?')[0];

      // Update profile with new avatar URL and get updated fields
      const { data: updatedProfile, error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: cleanUrl })
        .eq("user_id", userId)
        .select('avatar_url, updated_at')
        .single();

      if (updateError) throw updateError;

      // Update local state with fresh data
      setProfile({ 
        ...profile, 
        avatar_url: updatedProfile.avatar_url,
        updated_at: updatedProfile.updated_at
      });

      toast({
        title: "Profile picture updated",
        description: "Your new profile picture has been saved.",
      });
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload profile picture. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const resetInput = () => {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };

    try {
      const file = event.target.files?.[0];
      if (!file || !profile) {
        resetInput();
        return;
      }

      // Get file extension
      const ext = file.name.split(".").pop()?.toLowerCase();

      // Reject HEIC/HEIF on web
      if (ext === 'heic' || ext === 'heif') {
        toast({
          title: "Format not supported",
          description: "HEIC/HEIF format is not supported on web. Please convert to JPG or PNG first.",
          variant: "destructive",
        });
        resetInput();
        return;
      }

      // Validate type and extension
      const allowedExts = new Set(["jpg", "jpeg", "png", "gif", "webp"]);
      const isImageMime = file.type.startsWith("image/");
      const isAllowedExt = ext ? allowedExts.has(ext) : false;

      if (!isImageMime && !isAllowedExt) {
        toast({
          title: "Unsupported file",
          description: "Please select an image (JPEG, PNG, GIF, WEBP).",
          variant: "destructive",
        });
        resetInput();
        return;
      }

      await handleAvatarBlobUpload(file, ext || "jpg", file.type || undefined);
    } catch (error) {
      console.error("Error handling avatar upload:", error);
    } finally {
      resetInput();
    }
  };

  const handlePickAvatar = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const picked = await pickAvatarBlob();
        if (picked) {
          await handleAvatarBlobUpload(picked.blob, picked.ext, 'image/jpeg');
          return;
        }
      } catch (e: any) {
        if (e?.message === 'photos_denied') {
          toast({
            title: "Photos permission needed",
            description: "Please allow photo access in Settings.",
            variant: "destructive",
          });
          return;
        } else {
          console.error(e);
          toast({
            title: "Error",
            description: "Could not open photo library. Try again.",
            variant: "destructive",
          });
          return;
        }
      }
    }
    // Web fallback
    fileInputRef.current?.click();
  };
  const handleAddTag = (type: "strengths" | "interests" | "challenges") => {
    if (newTag.trim()) {
      const currentTags = editedData[type] || [];
      setEditedData({
        ...editedData,
        [type]: [...currentTags, newTag.trim()],
      });
      setNewTag("");
    }
  };
  const handleRemoveTag = (tagToRemove: string, type: "strengths" | "interests" | "challenges") => {
    const currentTags = editedData[type] || [];
    setEditedData({
      ...editedData,
      [type]: currentTags.filter((tag: string) => tag !== tagToRemove),
    });
  };
  return (
    <div className="min-h-[100dvh] bg-gradient-soft pt-safe-content">
      <PageHeader title="Profile" onBack={onBack} />

      <div className="px-6 pt-6 pb-4 space-y-6">
        {/* Profile Picture & Name */}
        {/* Avatar Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                {profile?.avatar_url ? (
                  <img src={`${profile.avatar_url}${profile?.updated_at ? `?v=${new Date(profile.updated_at).getTime()}` : ''}`} alt="Profile picture" className="w-20 h-20 rounded-full object-cover" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-primary flex items-center justify-center text-white text-2xl font-normal">
                    {profile?.first_name?.charAt(0) || "U"}
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                  onClick={handlePickAvatar}
                  disabled={uploading}
                >
                  <Camera className="h-4 w-4" />
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarUpload}
                  accept="image/*,image/heic,image/heif"
                  className="hidden"
                />
              </div>

              <div className="flex-1">
                <h2 className="text-xl font-bold">{profile?.first_name || "User"}</h2>
                <p className="text-muted-foreground">Lunabeam Member</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Information Card */}
        <div className="space-y-1">
          <h3 className="text-xl font-semibold">Profile Information</h3>
          <Card>
            <CardContent className="py-4">
            {editingSection === "basic" ? (
              <div className="space-y-3">
                <div>
                  <label className="text-base font-medium text-foreground mb-1 block">Name</label>
                  <Input
                    value={editedData.first_name || ""}
                    onChange={(e) =>
                      setEditedData({
                        ...editedData,
                        first_name: e.target.value,
                      })
                    }
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label className="text-base font-medium text-foreground mb-1 block">Email</label>
                  <Input
                    type="email"
                    value={editedData.email || ""}
                    onChange={(e) =>
                      setEditedData({
                        ...editedData,
                        email: e.target.value,
                      })
                    }
                    placeholder="Email address"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" onClick={() => handleSave("basic")}>
                    <Check className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleCancel}>
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-0">
                <div className="grid grid-cols-[120px,1fr] items-center py-3">
                  <span className="text-base font-medium text-muted-foreground">Name:</span>
                  <span className="text-base text-right">{profile?.first_name || "Not set"}</span>
                </div>
                <div className="grid grid-cols-[120px,1fr] items-center py-3 border-t">
                  <span className="text-base font-medium text-muted-foreground">Email:</span>
                  <span className="text-base text-right">{profile?.email || "Not set"}</span>
                </div>
                <div className="grid grid-cols-[120px,1fr] items-center py-3 border-t">
                  <span className="text-base font-medium text-muted-foreground">Date of Birth:</span>
                  <span className="text-base text-right">
                    {profile?.birthday ? format(new Date(profile.birthday), "PPP") : "Not set"}
                  </span>
                </div>
              </div>
            )}
            </CardContent>
          </Card>
          {editingSection !== "basic" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStartEdit("basic")}
              className="rounded-full"
            >
              Edit
            </Button>
          )}
        </div>

        {/* Security Section */}
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">Security</h3>
          <Card>
            <CardContent className="space-y-4 pt-6">
            {editingSection === "password" ? (
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">New Password</label>
                  <Input
                    type="password"
                    value={editedData.newPassword || ""}
                    onChange={(e) =>
                      setEditedData({
                        ...editedData,
                        newPassword: e.target.value,
                      })
                    }
                    placeholder="Enter new password"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Must be at least 6 characters</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Confirm Password</label>
                  <Input
                    type="password"
                    value={editedData.confirmPassword || ""}
                    onChange={(e) =>
                      setEditedData({
                        ...editedData,
                        confirmPassword: e.target.value,
                      })
                    }
                    placeholder="Confirm new password"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" onClick={() => handleSave("password")}>
                    <Check className="h-4 w-4 mr-1" />
                    Update Password
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleCancel}>
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Password</p>
                    <p className="text-sm text-muted-foreground">••••••••</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleStartEdit("password")}>
                  <Edit className="h-4 w-4 mr-1" />
                  Change Password
                </Button>
              </div>
            )}
            </CardContent>
          </Card>
        </div>

        {/* Tags Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Tags & Interests</h3>
            {editingSection !== "tags" && (
              <Button variant="outline" size="sm" onClick={() => handleStartEdit("tags")}>
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            )}
          </div>
          <Card>
            <CardContent className="space-y-4 pt-6">
            {editingSection === "tags" ? (
              <div className="space-y-4">
                {/* Strengths */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Strengths</h4>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(editedData.strengths || []).map((strength: string) => (
                      <div key={strength} className="flex items-center gap-1">
                        <Badge variant="secondary" className="text-xs">
                          {strength}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0"
                          onClick={() => handleRemoveTag(strength, "strengths")}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add strength"
                      onKeyPress={(e) => e.key === "Enter" && handleAddTag("strengths")}
                    />
                    <Button size="sm" onClick={() => handleAddTag("strengths")}>
                      Add
                    </Button>
                  </div>
                </div>

                {/* Interests */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Interests</h4>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(editedData.interests || []).map((interest: string) => (
                      <div key={interest} className="flex items-center gap-1">
                        <Badge variant="outline" className="text-xs">
                          {interest}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0"
                          onClick={() => handleRemoveTag(interest, "interests")}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add interest"
                      onKeyPress={(e) => e.key === "Enter" && handleAddTag("interests")}
                    />
                    <Button size="sm" onClick={() => handleAddTag("interests")}>
                      Add
                    </Button>
                  </div>
                </div>

                {/* Challenges */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Challenges</h4>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(editedData.challenges || []).map((challenge: string) => (
                      <div key={challenge} className="flex items-center gap-1">
                        <Badge variant="destructive" className="text-xs">
                          {challenge}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0"
                          onClick={() => handleRemoveTag(challenge, "challenges")}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add challenge"
                      onKeyPress={(e) => e.key === "Enter" && handleAddTag("challenges")}
                    />
                    <Button size="sm" onClick={() => handleAddTag("challenges")}>
                      Add
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={() => handleSave("tags")}>
                    <Check className="h-4 w-4 mr-1" />
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={handleCancel}>
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Strengths */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Strengths</h4>
                  <div className="flex flex-wrap gap-2">
                    {profile?.strengths?.map((strength) => (
                      <Badge key={strength} variant="secondary" className="text-xs">
                        {strength}
                      </Badge>
                    ))}
                    {(!profile?.strengths || profile.strengths.length === 0) && (
                      <p className="text-sm text-muted-foreground">No strengths added yet</p>
                    )}
                  </div>
                </div>

                {/* Interests */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Interests</h4>
                  <div className="flex flex-wrap gap-2">
                    {profile?.interests?.map((interest) => (
                      <Badge key={interest} variant="outline" className="text-xs">
                        {interest}
                      </Badge>
                    ))}
                    {(!profile?.interests || profile.interests.length === 0) && (
                      <p className="text-sm text-muted-foreground">No interests added yet</p>
                    )}
                  </div>
                </div>

                {/* Challenges */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Challenges</h4>
                  <div className="flex flex-wrap gap-2">
                    {profile?.challenges?.map((challenge) => (
                      <Badge key={challenge} variant="destructive" className="text-xs">
                        {challenge}
                      </Badge>
                    ))}
                    {(!profile?.challenges || profile.challenges.length === 0) && (
                      <p className="text-sm text-muted-foreground">No challenges added yet</p>
                    )}
                  </div>
                </div>
              </div>
            )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
};
