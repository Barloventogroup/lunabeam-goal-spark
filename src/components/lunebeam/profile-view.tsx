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
  User,
  Tag,
  Shield,
  Camera,
  Check,
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
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
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file || !profile) return;
      setUploading(true);

      // Upload file to Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${profile.user_id}/avatar.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(fileName, file, {
        upsert: true,
        contentType: file.type,
      });
      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(fileName);

      // Add cache-busting timestamp to force browser to reload new image
      const cacheBustedUrl = `${publicUrl}?t=${Date.now()}`;

      // Update profile with avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          avatar_url: cacheBustedUrl,
        })
        .eq("user_id", profile.user_id);
      if (updateError) throw updateError;
      setProfile({
        ...profile,
        avatar_url: cacheBustedUrl,
      });
      toast({
        title: "Profile picture updated",
        description: "Your new profile picture has been saved.",
      });
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast({
        title: "Error",
        description: "Failed to upload profile picture. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
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
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <CardTitle>Profile Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Avatar Section */}
            <div className="flex items-center gap-4">
              <div className="relative">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile picture" className="w-20 h-20 rounded-full object-cover" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-primary flex items-center justify-center text-white text-2xl font-normal">
                    {profile?.first_name?.charAt(0) || "U"}
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Camera className="h-4 w-4" />
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarUpload}
                  accept=".jpg,.jpeg,.png,.gif,.webp,.heic,.heif"
                  className="hidden"
                />
              </div>

              {/* Name Section */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div>
                    <h2 className="text-xl font-bold">{profile?.first_name || "User"}</h2>
                    <p className="text-muted-foreground">Lunabeam Member</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Basic Information */}
            {editingSection === "basic" ? (
              <div className="space-y-3 pt-4 border-t">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Name</label>
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
                  <label className="text-sm font-medium text-foreground mb-1 block">Email</label>
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
              <div className="space-y-2 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Name</p>
                    <p className="text-sm text-muted-foreground">{profile?.first_name || "Not set"}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Email</p>
                    <p className="text-sm text-muted-foreground">{profile?.email || "Not set"}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Birthday</p>
                    <p className="text-sm text-muted-foreground">
                      {profile?.birthday ? format(new Date(profile.birthday), "PPP") : "Not set"}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleStartEdit("basic")} className="mt-2">
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle>Security</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
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

        {/* Tags Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-primary" />
                <CardTitle>Tags & Interests</CardTitle>
              </div>
              {editingSection !== "tags" && (
                <Button variant="outline" size="sm" onClick={() => handleStartEdit("tags")}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
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
  );
};
