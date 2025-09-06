import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, 
  Edit, 
  Plus, 
  FileText, 
  Download, 
  Upload,
  X,
  Save,
  User,
  Tag,
  Shield
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { Profile } from '@/types';

interface ProfileViewProps {
  onBack: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onBack }) => {
  const { profile } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Profile | null>(profile);
  const [newTag, setNewTag] = useState('');
  const [showAddTag, setShowAddTag] = useState(false);

  // Mock documents data - this would come from the database
  const [documents] = useState([
    {
      id: '1',
      name: 'Medical Report.pdf',
      uploadedBy: 'Dr. Smith',
      uploadedAt: '2024-01-15',
      type: 'medical',
      size: '2.3 MB'
    },
    {
      id: '2',
      name: 'Assessment Results.pdf',
      uploadedBy: 'School Counselor',
      uploadedAt: '2024-01-10',
      type: 'assessment',
      size: '1.8 MB'
    }
  ]);

  const handleSave = async () => {
    // Here you would save the profile changes to the database
    console.log('Saving profile changes:', editedProfile);
    setIsEditing(false);
  };

  const handleAddTag = () => {
    if (newTag.trim() && editedProfile) {
      const updatedInterests = [...(editedProfile.interests || []), newTag.trim()];
      setEditedProfile({
        ...editedProfile,
        interests: updatedInterests
      });
      setNewTag('');
      setShowAddTag(false);
    }
  };

  const handleRemoveTag = (tagToRemove: string, type: 'strengths' | 'interests') => {
    if (editedProfile) {
      const updatedTags = editedProfile[type]?.filter(tag => tag !== tagToRemove) || [];
      setEditedProfile({
        ...editedProfile,
        [type]: updatedTags
      });
    }
  };

  const currentProfile = isEditing ? editedProfile : profile;

  return (
    <div className="min-h-screen bg-gradient-soft">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 bg-card/80 backdrop-blur border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onBack}
              className="p-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Profile</h1>
              <p className="text-sm text-muted-foreground">Personal information and settings</p>
            </div>
          </div>
          {!isEditing ? (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setIsEditing(false);
                  setEditedProfile(profile);
                }}
              >
                Cancel
              </Button>
              <Button 
                size="sm"
                onClick={handleSave}
              >
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="px-6 pt-6 pb-4 space-y-6">
        {/* Profile Summary */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <CardTitle>Profile Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gradient-primary flex items-center justify-center text-white text-2xl font-bold">
                {currentProfile?.first_name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1">
                {isEditing ? (
                  <Input
                    value={editedProfile?.first_name || ''}
                    onChange={(e) => setEditedProfile(prev => prev ? {...prev, first_name: e.target.value} : null)}
                    className="text-xl font-bold"
                    placeholder="First name"
                  />
                ) : (
                  <h2 className="text-xl font-bold">{currentProfile?.first_name || 'User'}</h2>
                )}
                <p className="text-muted-foreground">Lunabeam Member</p>
                <p className="text-sm text-muted-foreground">
                  Member since {new Date(currentProfile?.onboarding_complete ? '2024-01-01' : '').toLocaleDateString() || 'Recently'}
                </p>
              </div>
            </div>

            {/* Communication Preference */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Communication Preference</label>
              {isEditing ? (
                <select
                  value={editedProfile?.comm_pref || 'text'}
                  onChange={(e) => setEditedProfile(prev => prev ? {...prev, comm_pref: e.target.value as 'voice' | 'text'} : null)}
                  className="w-full p-2 border rounded"
                >
                  <option value="text">Text</option>
                  <option value="voice">Voice</option>
                </select>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {currentProfile?.comm_pref || 'Not specified'}
                </p>
              )}
            </div>
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
              {isEditing && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowAddTag(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Tag
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Strengths */}
            <div>
              <h4 className="text-sm font-medium mb-2">Strengths</h4>
              <div className="flex flex-wrap gap-2">
                {currentProfile?.strengths?.map(strength => (
                  <div key={strength} className="flex items-center gap-1">
                    <Badge variant="secondary" className="text-xs">
                      {strength}
                    </Badge>
                    {isEditing && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0"
                        onClick={() => handleRemoveTag(strength, 'strengths')}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
                {(!currentProfile?.strengths || currentProfile.strengths.length === 0) && (
                  <p className="text-sm text-muted-foreground">No strengths added yet</p>
                )}
              </div>
            </div>

            {/* Interests */}
            <div>
              <h4 className="text-sm font-medium mb-2">Interests</h4>
              <div className="flex flex-wrap gap-2">
                {currentProfile?.interests?.map(interest => (
                  <div key={interest} className="flex items-center gap-1">
                    <Badge variant="outline" className="text-xs">
                      {interest}
                    </Badge>
                    {isEditing && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0"
                        onClick={() => handleRemoveTag(interest, 'interests')}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
                {(!currentProfile?.interests || currentProfile.interests.length === 0) && (
                  <p className="text-sm text-muted-foreground">No interests added yet</p>
                )}
              </div>
            </div>

            {/* Challenges */}
            <div>
              <h4 className="text-sm font-medium mb-2">Challenges</h4>
              <div className="flex flex-wrap gap-2">
                {currentProfile?.challenges?.map(challenge => (
                  <div key={challenge} className="flex items-center gap-1">
                    <Badge variant="destructive" className="text-xs">
                      {challenge}
                    </Badge>
                    {isEditing && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0"
                        onClick={() => {
                          if (editedProfile) {
                            const updatedChallenges = editedProfile.challenges?.filter(c => c !== challenge) || [];
                            setEditedProfile({
                              ...editedProfile,
                              challenges: updatedChallenges
                            });
                          }
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
                {(!currentProfile?.challenges || currentProfile.challenges.length === 0) && (
                  <p className="text-sm text-muted-foreground">No challenges added yet</p>
                )}
              </div>
            </div>

            {/* Add Tag Input */}
            {showAddTag && (
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Enter new tag"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                />
                <Button size="sm" onClick={handleAddTag}>Add</Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setShowAddTag(false);
                    setNewTag('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Documents Section - Only visible to admin viewers */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>Supporting Documents</CardTitle>
                  <p className="text-xs text-muted-foreground">Admin access only</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-1" />
                Upload
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {documents.map(doc => (
              <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Uploaded by {doc.uploadedBy} on {doc.uploadedAt} • {doc.size}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {documents.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No documents uploaded yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};