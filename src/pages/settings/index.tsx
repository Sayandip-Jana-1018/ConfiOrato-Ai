import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import AppLayout from '../../components/layout/AppLayout';
import GlassCard from '../../components/ui/GlassCard';
import { 
  HiUser, 
  HiGlobe, 
  HiShieldCheck, 
  HiCog, 
  HiMicrophone, 
  HiSun, 
  HiMoon, 
  HiColorSwatch,
  HiKey,
  HiTrash,
  HiLink,
  HiQuestionMarkCircle,
  HiChat,
  HiBell,
  HiExclamation,
  HiLightBulb,
  HiPencil,
  HiLogout
} from 'react-icons/hi';
import { FaGoogle, FaFacebook, FaLinkedin, FaGithub, FaInstagram } from 'react-icons/fa';
import { supabase } from '../../lib/supabase';
import ThemeSelector from '@/components/ThemeSelector';
import { useRouter } from 'next/router';

interface SettingsState {
  profile: {
    full_name: string;
    email: string;
    phone: string;
    bio: string;
    role: string;
    photoUrl: string;
  };
  theme: {
    color: string;
    isDarkMode: boolean;
  };
  account: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  };
  notifications: {
    email: boolean;
    practice: boolean;
    community: boolean;
  };
  privacy: {
    showProfile: boolean;
    shareActivity: boolean;
    allowMessages: boolean;
  };
  darkMode: boolean;
}

export default function Settings() {
  const { themeColor, setThemeColor, darkMode, setDarkMode } = useTheme();
  const [settings, setSettings] = useState<SettingsState>({
    profile: {
      full_name: '',
      email: '',
      phone: '',
      bio: '',
      role: '',
      photoUrl: '',
    },
    theme: {
      color: themeColor,
      isDarkMode: darkMode,
    },
    account: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    notifications: {
      email: true,
      practice: true,
      community: false,
    },
    privacy: {
      showProfile: true,
      shareActivity: false,
      allowMessages: true,
    },
    darkMode: darkMode,
  });
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // State for authentication
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  // Get user from Supabase
  const [user, setUser] = useState<any>(null);

  // Check if user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // For development purposes, we'll create a mock user instead of redirecting
        setIsAuthenticated(false);
        setUser({
          id: 'mock-user-id',
          email: 'user@example.com'
        });
        
        // In production, you would redirect to login:
        // router.push('/auth/signin');
      } else {
        setIsAuthenticated(true);
        setUser(session.user);
      }
    };
    
    checkAuth();
  }, []);

  // Create profile if it doesn't exist
  useEffect(() => {
    const createProfileIfNotExists = async () => {
      if (!user) return;
      
      try {
        // Check if profile exists
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (error && error.code === 'PGRST116') {
          console.log('Profile not found, creating new profile for user:', user.id);
          // Profile doesn't exist, create one
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              full_name: user.user_metadata?.full_name || 'New User',
              email: user.email,
              phone: '',
              bio: '',
              role: 'Member'
            });
            
          if (insertError) {
            console.error('Error creating profile:', insertError);
            // If it's a duplicate key error, the profile already exists (race condition)
            if (insertError.message.includes('duplicate key') || insertError.code === '23505') {
              console.log('Profile already exists (duplicate key). This is likely a race condition.');
              // No need to alert the user about this
            } else {
              alert('Error creating profile: ' + insertError.message);
            }
          } else {
            console.log('Profile created successfully');
          }
        } else if (error) {
          console.error('Error checking profile:', error);
        } else {
          console.log('Profile already exists:', data);
        }
      } catch (error) {
        console.error('Error in createProfileIfNotExists:', error);
      }
    };
    
    createProfileIfNotExists();
  }, [user]);

  // Load user profile data on component mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        if (!currentUser) {
          console.log('No user found');
          setLoading(false);
          return;
        }
        
        console.log('Current user:', currentUser);
        setUser(currentUser);
        
        // Get profile data
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single();
          
        if (error) {
          console.log('Error fetching profile:', error);
          
          // If profile doesn't exist, create one
          if (error.code === 'PGRST116') {
            console.log('Profile not found, creating new profile');
            
            // First check if profile already exists (to avoid duplicate key error)
            const { data: checkData, error: checkError } = await supabase
              .from('profiles')
              .select('id')
              .eq('id', currentUser.id);
              
            if (checkData && checkData.length > 0) {
              console.log('Profile already exists despite PGRST116 error. Fetching again...');
              
              // Try to fetch the profile again
              const { data: refetchData, error: refetchError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', currentUser.id)
                .single();
                
              if (refetchError) {
                console.error('Error refetching profile:', refetchError);
              } else if (refetchData) {
                // Process the refetched profile data
                processProfileData(refetchData, currentUser);
                setLoading(false);
                return;
              }
            }
            
            // Profile truly doesn't exist, create it
            const { error: insertError, data: insertData } = await supabase
              .from('profiles')
              .insert({
                id: currentUser.id,
                full_name: currentUser.user_metadata?.full_name || 'New User',
                email: currentUser.email,
                phone: '',
                bio: '',
                role: 'Member'
              })
              .select();
              
            if (insertError) {
              console.error('Error creating profile:', insertError);
              
              // If it's a duplicate key error, the profile already exists (race condition)
              if (insertError.message.includes('duplicate key') || insertError.code === '23505') {
                console.log('Profile already exists (duplicate key). This is likely a race condition. Fetching profile...');
                
                // Try to fetch the profile again
                const { data: existingData, error: fetchError } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', currentUser.id)
                  .single();
                  
                if (fetchError) {
                  console.error('Error fetching existing profile:', fetchError);
                  alert('Error loading profile data. Please try refreshing the page.');
                } else if (existingData) {
                  // Process the existing profile data
                  processProfileData(existingData, currentUser);
                }
              } else {
                alert('Error creating profile: ' + insertError.message);
              }
              
              setLoading(false);
              return;
            } else {
              console.log('New profile created:', insertData);
              
              if (insertData && insertData.length > 0) {
                // Process the newly created profile data
                processProfileData(insertData[0], currentUser);
              } else {
                // Fallback to default values if no data returned
                const defaultProfile = {
                  full_name: currentUser.user_metadata?.full_name || 'New User',
                  email: currentUser.email,
                  phone: '',
                  bio: '',
                  role: 'Member'
                };
                processProfileData(defaultProfile, currentUser);
              }
            }
          } else {
            alert('Error fetching profile: ' + error.message);
          }
          setLoading(false);
          return;
        }
        
        console.log('Profile data retrieved:', data);
        
        if (data) {
          // Process the retrieved profile data
          processProfileData(data, currentUser);
        }
      } catch (error) {
        console.error('Error in fetchUserProfile:', error);
        alert('Error loading profile. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    };
    
    // Helper function to process profile data and update state
    const processProfileData = async (profileData: any, currentUser: any) => {
      // Try to get profile photo from user bucket
      let photoUrl = '';
      try {
        // Check if photo exists in user bucket using user ID
        const { data: fileData, error: fileError } = await supabase.storage
          .from('user')
          .list(currentUser.id);
          
        if (!fileError && fileData && fileData.length > 0) {
          // Get the first file that matches the user ID
          const fileName = `${currentUser.id}/${fileData[0].name}`;
          const { data: urlData } = supabase.storage
            .from('user')
            .getPublicUrl(fileName);
            
          photoUrl = urlData?.publicUrl || '';
        }
      } catch (photoError) {
        console.error('Error getting profile photo:', photoError);
      }
      
      setSettings(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          full_name: profileData.full_name || '',
          email: profileData.email || currentUser.email || '',
          phone: profileData.phone || '',
          bio: profileData.bio || '',
          role: profileData.role || 'Member',
          photoUrl: photoUrl
        }
      }));
    };
    
    fetchUserProfile();
  }, []);

  // Function to update user profile
  const updateProfile = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('User not found');
      
      console.log('Updating profile for user:', user.id);
      console.log('Profile data to update:', {
        full_name: settings.profile.full_name,
        email: settings.profile.email,
        bio: settings.profile.bio,
        phone: settings.profile.phone,
        role: settings.profile.role,
        updated_at: new Date()
      });
      
      // First check if profile exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();
        
      if (checkError && checkError.code === 'PGRST116') {
        // Profile doesn't exist, create it
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            full_name: settings.profile.full_name,
            email: settings.profile.email,
            bio: settings.profile.bio,
            phone: settings.profile.phone,
            role: settings.profile.role
          });
          
        if (insertError) {
          console.error('Error creating profile:', insertError);
          
          // If it's a duplicate key error, the profile already exists (race condition)
          if (insertError.message.includes('duplicate key') || insertError.code === '23505') {
            console.log('Profile already exists (duplicate key). This is likely a race condition. Updating profile instead...');
            
            // Update the profile instead
            const { error: updateError } = await supabase
              .from('profiles')
              .update({
                full_name: settings.profile.full_name,
                email: settings.profile.email,
                bio: settings.profile.bio,
                phone: settings.profile.phone,
                role: settings.profile.role,
                updated_at: new Date()
              })
              .eq('id', user.id);
              
            if (updateError) {
              console.error('Error updating profile after duplicate key error:', updateError);
              throw updateError;
            }
          } else {
            throw insertError;
          }
        }
      } else {
        // Update existing profile
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: settings.profile.full_name,
            email: settings.profile.email,
            bio: settings.profile.bio,
            phone: settings.profile.phone,
            role: settings.profile.role,
            updated_at: new Date()
          })
          .eq('id', user.id);
          
        if (error) {
          console.error('Error updating profile:', error);
          throw error;
        }
      }
      
      console.log('Profile updated successfully');
      alert('Profile updated successfully!');
      
      // Verify the update by fetching the profile again
      const { data: updatedProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (fetchError) {
        console.error('Error verifying profile update:', fetchError);
      } else {
        console.log('Verified updated profile:', updatedProfile);
      }
      
    } catch (error: any) {
      console.error('Error in updateProfile:', error);
      alert(error.message || 'Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  // Function to upload profile image
  const uploadProfileImage = async (file: File) => {
    try {
      setLoading(true);
      
      if (!user) {
        alert('You must be logged in to upload a profile image');
        setLoading(false);
        return;
      }
      
      console.log('Uploading profile image for user:', user.id);
      
      // Create a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      // Use the 'user' bucket from Supabase
      const bucketName = 'user';
      
      console.log(`Uploading to ${bucketName}/${fileName}`);
      
      // First, check if the user folder exists, if not create it
      try {
        await supabase.storage
          .from(bucketName)
          .upload(`${user.id}/.folder`, new Blob(['']));
      } catch (folderError) {
        // Ignore errors here, folder might already exist
        console.log('Folder creation attempt:', folderError);
      }
      
      // Upload the file directly
      const { error: uploadError, data } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file, {
          upsert: true,
          cacheControl: '3600'
        });
        
      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        
        if (uploadError.message.includes('bucket') && uploadError.message.includes('not found')) {
          alert('Storage bucket not found. Please create a "user" bucket in your Supabase storage.');
        } else if (uploadError.message.includes('security policy')) {
          alert(`Permission denied: Please check your Supabase storage security policies. 
          
Make sure you have created the "user" bucket in Supabase storage and set up the following policies:
1. Allow users to view all files in the user bucket
2. Allow users to upload files to their own folder (named with their user ID)
3. Allow users to update their own files
4. Allow users to delete their own files`);
        } else {
          alert('Failed to upload image: ' + uploadError.message);
        }
        
        setLoading(false);
        return;
      }
      
      // Get the public URL
      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);
        
      const photoUrl = publicUrlData?.publicUrl;
      
      console.log('Image uploaded successfully. Public URL:', photoUrl);
      
      // Update local state first
      handleSettingChange('profile', { ...settings.profile, photoUrl });
      
      // Success message
      alert('Profile image updated successfully');
      
    } catch (error: any) {
      console.error('Error in uploadProfileImage:', error);
      alert(error.message || 'An error occurred while uploading the image');
    } finally {
      setLoading(false);
    }
  };

  // Function to handle profile image changes
  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Create a local preview
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        handleSettingChange('profile', {
          ...settings.profile,
          photoUrl: event.target.result as string
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Function to handle password changes
  const handlePasswordChange = async () => {
    setPasswordError('');
    setPasswordSuccess('');
    setLoading(true);
    
    if (settings.account.newPassword !== settings.account.confirmPassword) {
      setPasswordError('New passwords do not match');
      setLoading(false);
      return;
    }
    
    if (settings.account.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }
    
    try {
      // In a real app, you would update the password in your auth system
      // For example:
      // const { error } = await supabase.auth.updateUser({
      //   password: settings.account.newPassword
      // });
      
      // if (error) throw error;
      
      setPasswordSuccess('Password updated successfully');
      setSettings(prev => ({
        ...prev,
        account: {
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }
      }));
    } catch (error: any) {
      setPasswordError(error.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    
    setSettings(prev => ({
      ...prev,
      darkMode: newDarkMode,
      theme: {
        ...prev.theme,
        isDarkMode: newDarkMode
      }
    }));
    
    // Update in theme context
    setDarkMode(newDarkMode);
    
    // Save to local storage
    localStorage.setItem('darkMode', JSON.stringify(newDarkMode));
  };

  // Function to handle theme color change
  const handleThemeColorChange = (color: string) => {
    setThemeColor(color);
    // Save to local storage or user preferences
    localStorage.setItem('themeColor', color);
  };

  // Theme colors from ThemeSelector
  const themeColors = [
    '#6B21A8', // Purple
    '#8B5CF6', // Violet
    '#3B82F6', // Blue
    '#06B6D4', // Cyan
    '#10B981', // Emerald
    '#22C55E', // Green
    '#EAB308', // Yellow
    '#F97316', // Orange
    '#EF4444', // Red
    '#EC4899', // Pink
    '#8B5CF6', // Violet
    '#6366F1', // Indigo
    '#3B82F6', // Blue
    '#14B8A6', // Teal
    '#A855F7', // Purple-500
    '#D946EF', // Fuchsia-500
    '#F43F5E', // Rose-500
    '#0EA5E9', // Sky-500
    '#84CC16', // Lime-500
    '#64748B', // Slate-500
    '#475569', // Slate-600
    '#0891B2', // Cyan-600
    '#0D9488', // Teal-600
    '#7C3AED', // Violet-600
    '#4F46E5'  // Indigo-600
  ];

  // Add social media accounts state
  const [socialAccounts, setSocialAccounts] = useState({
    google: false,
    facebook: false,
    linkedin: false,
    github: false,
    instagram: false
  });

  // State for FAQs
  const [openFaqs, setOpenFaqs] = useState({
    faq1: false,
    faq2: false,
    faq3: false
  });
  
  // Toggle FAQ
  const toggleFaq = (faqId: keyof typeof openFaqs) => {
    setOpenFaqs(prev => ({
      ...prev,
      [faqId]: !prev[faqId]
    }));
  };

  // Generic function to handle setting changes
  const handleSettingChange = (
    section: keyof SettingsState,
    value: any
  ) => {
    setSettings((prev) => ({
      ...prev,
      [section]: value,
    }));
    
    // For demo purposes, we'll just log the changes
    console.log(`Updated ${section}:`, value);
    
    // In a real app, you would save these changes to your backend
    // For example:
    // saveSettingsToSupabase(section, value);
  };

  // Function to connect/disconnect social account
  const toggleSocialAccount = (platform: keyof typeof socialAccounts) => {
    setSocialAccounts(prev => ({
      ...prev,
      [platform]: !prev[platform]
    }));
    
    // In a real app, you would connect to the social platform
    // For example:
    // if (!socialAccounts[platform]) {
    //   connectToSocialPlatform(platform);
    // } else {
    //   disconnectFromSocialPlatform(platform);
    // }
  };

  // Function to sign out
  const handleSignOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Redirect to sign-in page
      router.push('/auth');
    } catch (error: any) {
      alert(error.message || 'Failed to sign out');
    } finally {
      setLoading(false);
    }
  };

  // State to store all email IDs from the profiles table
  const [allEmails, setAllEmails] = useState<string[]>([]);

  // Fetch all email IDs from the profiles table
  useEffect(() => {
    const fetchAllEmails = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('email');
        
        if (error) {
          console.error('Error fetching all emails:', error);
        } else if (data) {
          setAllEmails(data.map((profile: any) => profile.email).filter(Boolean));
        }
      } catch (error) {
        console.error('Error in fetchAllEmails:', error);
      }
    };
    
    fetchAllEmails();
  }, []);

  // Function to switch account
  const switchAccount = async (email: string) => {
    try {
      setLoading(true);
      
      // Sign out the current user
      await supabase.auth.signOut();
      
      // Redirect to home page
      router.push('/');
      
      // Show a message to the user
      alert(`Please sign in with the account: ${email}`);
      
    } catch (error: any) {
      console.error('Error in switchAccount:', error);
      alert(error.message || 'Failed to switch account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout title="Settings">
      <div className="mt-10 space-y-6">        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Profile Information */}
          <GlassCard className="p-6">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-3">
                <HiUser className="w-6 h-6 text-blue-500" />
              </div>
              <h2 className="text-xl font-semibold text-white">Profile Information</h2>
            </div>
            
            <div className="flex flex-col items-center">
              {/* Profile Image */}
              <div className="mb-6">
                <div className="w-32 h-32 ml-6 rounded-full overflow-hidden border-4 border-white/10 mb-3 relative group">
                  {settings.profile.photoUrl ? (
                    <img 
                      src={settings.profile.photoUrl} 
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-3xl font-bold text-white">
                      {settings.profile.full_name ? settings.profile.full_name.substring(0, 2).toUpperCase() : 'US'}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <label className="cursor-pointer text-white text-sm font-medium">
                      Change
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*" 
                        onChange={(e) => {
                          handleProfileImageChange(e);
                          if (e.target.files && e.target.files[0]) {
                            uploadProfileImage(e.target.files[0]);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
                <h3 className="text-lg font-medium text-white">{settings.profile.full_name || 'Your Name'}</h3>
                <p className="text-white/60 text-sm">{settings.profile.email || 'your.email@example.com'}</p>
              </div>
              
              {/* Profile Details */}
              <div className="w-full space-y-4">
                <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2">
                  <div className="">
                    <label className="block text-white/60 text-sm mb-1">Full Name</label>
                    <div className="flex items-center">
                    <button 
                    className="mr-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    title="Edit name"
                  >
                    <HiPencil className="w-4 h-4 text-white/60" />
                  </button>
                    <input 
                      type="text" 
                      value={settings.profile.full_name} 
                      onChange={(e) => handleSettingChange('profile', { ...settings.profile, full_name: e.target.value })}
                      className="w-full text-center bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                      placeholder="Enter your full name"
                    />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="">
                    <label className="block text-white/60 text-sm mb-1">Phone Number</label>
                    <input 
                      type="tel" 
                      value={settings.profile.phone} 
                      onChange={(e) => handleSettingChange('profile', { ...settings.profile, phone: e.target.value })}
                      className="w-full text-center bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                      placeholder="Enter your phone number"
                    />
                  </div>
                  <button 
                    className="mt-6 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    title="Edit phone"
                  >
                    <HiPencil className="w-4 h-4 text-white/60" />
                  </button>
                </div>
                </div>
                <div className="flex items-center gap-2">
                <div>
                  <label className="block text-white/60 text-sm mb-1">Email</label>
                  <input 
                    type="email" 
                    value={settings.profile.email} 
                    onChange={(e) => handleSettingChange('profile', { ...settings.profile, email: e.target.value })}
                    className="w-[260px] text-center bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                    placeholder="Enter your email"
                    disabled
                  />
                </div>
                
                <div>
                  <label className="block text-white/60 text-sm mb-1">Role</label>
                  <input 
                    type="text" 
                    value={settings.profile.role} 
                    onChange={(e) => handleSettingChange('profile', { ...settings.profile, role: e.target.value })}
                    className="w-full text-center bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                    placeholder="Enter your role"
                  />
                </div>
                </div>
                
                <div>
                  <label className="block text-white/60 text-sm mb-1">Bio</label>
                  <textarea 
                    value={settings.profile.bio} 
                    onChange={(e) => handleSettingChange('profile', { ...settings.profile, bio: e.target.value })}
                    className="w-full text-center bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all resize-none"
                    placeholder="Tell us about yourself"
                    rows={2}
                  />
                </div>
                
                <button
                  onClick={updateProfile}
                  disabled={loading}
                  className="w-full px-4 py-2 rounded-lg text-white transition-all"
                  style={{ backgroundColor: `${themeColor}40` }}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
            <div className="pt-6 border-t border-white/10">
                <h3 className="text-white font-medium mb-4">Linked Accounts</h3>
                <div className="flex flex-wrap gap-3 justify-center">
                  <button 
                    onClick={() => toggleSocialAccount('linkedin')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      socialAccounts.linkedin 
                        ? 'bg-blue-700/20 text-blue-400 hover:bg-blue-700/30' 
                        : 'bg-white/5 text-white hover:bg-white/10'
                    }`}
                  >
                    <FaLinkedin className="w-5 h-5" />
                    <span>{socialAccounts.linkedin ? 'Disconnect' : 'Connect'}</span>
                  </button>
                  
                  <button 
                    onClick={() => toggleSocialAccount('github')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      socialAccounts.github 
                        ? 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30' 
                        : 'bg-white/5 text-white hover:bg-white/10'
                    }`}
                  >
                    <FaGithub className="w-5 h-5" />
                    <span>{socialAccounts.github ? 'Disconnect' : 'Connect'}</span>
                  </button>
                  
                  <button 
                    onClick={() => toggleSocialAccount('instagram')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      socialAccounts.instagram 
                        ? 'bg-pink-500/20 text-pink-400 hover:bg-pink-500/30' 
                        : 'bg-white/5 text-white hover:bg-white/10'
                    }`}
                  >
                    <FaInstagram className="w-5 h-5" />
                    <span>{socialAccounts.instagram ? 'Disconnect' : 'Connect'}</span>
                  </button>
                </div>
              </div>
          </GlassCard>
          
          {/* Theme Settings */}
          <GlassCard className="p-6">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-3">
                <HiColorSwatch className="w-6 h-6 text-purple-500" />
              </div>
              <h2 className="text-xl font-semibold text-white">Theme Settings</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-white font-medium mb-3 text-center">Color Theme</h3>
                <div className="grid grid-cols-5 gap-2">
                  {themeColors.map((color, index) => (
                    <button
                      key={index}
                      className={`w-full aspect-square rounded-lg transition-transform ${
                        themeColor === color ? 'ring-2 ring-white scale-110' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => handleThemeColorChange(color)}
                      aria-label={`Set theme color to ${color}`}
                    />
                  ))}
                </div>
                <p className="text-white/60 text-sm text-center mt-3">
                  For more colors, use the Theme Selector in the top-right corner
                </p>
              </div>
              
              <button
                onClick={() => handleThemeColorChange('#6B21A8')}
                className="w-full px-4 py-2 rounded-lg bg-white/5 text-white hover:bg-white/10 transition-colors"
              >
                Reset to Default Theme
              </button>
            </div>
          </GlassCard>
          
          {/* Account Management */}
          <GlassCard className="p-6">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-3">
                <HiKey className="w-6 h-6 text-blue-500" />
              </div>
              <h2 className="text-xl font-semibold text-white">Account Management</h2>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-white font-medium">Change Password</h3>
                
                {passwordError && (
                  <div className="bg-red-500/20 border border-red-500/50 text-white rounded-lg p-3 text-sm">
                    {passwordError}
                  </div>
                )}
                
                {passwordSuccess && (
                  <div className="bg-green-500/20 border border-green-500/50 text-white rounded-lg p-3 text-sm">
                    {passwordSuccess}
                  </div>
                )}
                
                <form onSubmit={(e) => { e.preventDefault(); handlePasswordChange(); }} className="space-y-4">
                  <div>
                    <label className="block text-white/60 text-sm mb-1">Current Password</label>
                    <input
                      type="password"
                      value={settings.account.currentPassword}
                      onChange={(e) => handleSettingChange('account', { ...settings.account, currentPassword: e.target.value })}
                      className="w-full text-center bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                      placeholder="Enter current password"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-white/60 text-sm mb-1">New Password</label>
                    <input
                      type="password"
                      value={settings.account.newPassword}
                      onChange={(e) => handleSettingChange('account', { ...settings.account, newPassword: e.target.value })}
                      className="w-full text-center bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                      placeholder="Enter new password"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-white/60 text-sm mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      value={settings.account.confirmPassword}
                      onChange={(e) => handleSettingChange('account', { ...settings.account, confirmPassword: e.target.value })}
                      className="w-full text-center bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                      placeholder="Confirm new password"
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-4 py-2 rounded-lg text-white transition-all flex items-center justify-center"
                    style={{ backgroundColor: `${themeColor}40` }}
                  >
                    {loading ? (
                      <div className="animate-spin h-5 w-5 border-2 border-white/20 rounded-full border-t-white"></div>
                    ) : (
                      'Update Password'
                    )}
                  </button>
                </form>
              </div>
              
              <div className="pt-6 border-t border-white/10">
                <button
                  onClick={handleSignOut}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 text-white hover:bg-white/10 transition-colors mb-4 flex items-center justify-center gap-2"
                >
                  <HiLogout className="w-5 h-5" />
                  Sign Out
                </button>
                
                {/* Switch Account Section */}
                <div className="mt-4">
                  <h3 className="text-white font-medium mb-3 text-center">Switch Account</h3>
                  <div className="flex flex-col items-center space-y-4">
                    {allEmails.map((email: string, index: number) => (
                      <button
                        key={index}
                        onClick={() => switchAccount(email)}
                        className="w-full px-4 py-2 rounded-lg bg-white/5 text-white hover:bg-white/10 transition-colors"
                      >
                        {email}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
          
          {/* Notifications */}
          <GlassCard className="p-6">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center mb-3">
                <HiBell className="w-6 h-6 text-yellow-500" />
              </div>
              <h2 className="text-xl font-semibold text-white">Notifications</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <h3 className="text-white font-medium">Email Notifications</h3>
                  <p className="text-white/60 text-sm">Receive updates and reminders via email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifications.email}
                    onChange={(e) => handleSettingChange('notifications', { ...settings.notifications, email: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-white/10 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <h3 className="text-white font-medium">Practice Reminders</h3>
                  <p className="text-white/60 text-sm">Get notified about scheduled practice sessions</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifications.practice}
                    onChange={(e) => handleSettingChange('notifications', { ...settings.notifications, practice: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-white/10 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <h3 className="text-white font-medium">Community Updates</h3>
                  <p className="text-white/60 text-sm">Stay informed about community events</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifications.community}
                    onChange={(e) => handleSettingChange('notifications', { ...settings.notifications, community: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-white/10 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
                </label>
              </div>
              
              <div className="pt-4 border-t border-white/10 mt-4">
                <h3 className="text-white font-medium mb-3 text-left">Notification Preferences</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white">Email Frequency</span>
                    <select
                      className="bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                    >
                      <option>Immediately</option>
                      <option>Daily Digest</option>
                      <option>Weekly Digest</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-white">Push Notifications</span>
                    <select
                      className="bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                    >
                      <option>All</option>
                      <option>Important Only</option>
                      <option>None</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
          
          {/* Support & Feedback */}
          <GlassCard className="p-6">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center mb-3">
                <HiQuestionMarkCircle className="w-6 h-6 text-green-500" />
              </div>
              <h2 className="text-xl font-semibold text-white">Support & Feedback</h2>
            </div>
            
            <div className="flex flex-col items-center space-y-6">
              <div className="text-center max-w-md mx-auto">
                <p className="text-white/80 mb-4">
                  We're constantly working to improve your experience. Have questions or suggestions? We'd love to hear from you!
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-sm mx-auto">
                  <button
                    className="flex flex-col items-center justify-center p-4 rounded-xl bg-black/30 hover:bg-black/40 transition-colors text-white"
                  >
                    <HiChat className="w-8 h-8 mb-2 text-green-400" />
                    <span>Contact Support</span>
                  </button>
                  
                  <button
                    className="flex flex-col items-center justify-center p-4 rounded-xl bg-black/30 hover:bg-black/40 transition-colors text-white"
                  >
                    <HiLightBulb className="w-8 h-8 mb-2 text-yellow-400" />
                    <span>Submit Feedback</span>
                  </button>
                </div>
              </div>
              
              <div className="w-full max-w-md mx-auto pt-6 border-t border-white/10">
                <h3 className="text-white font-medium mb-4 text-center">Frequently Asked Questions</h3>
                
                <div className="space-y-3">
                  <div className="bg-black/30 rounded-lg overflow-hidden">
                    <button
                      className="w-full flex items-center justify-between p-3 text-white hover:bg-black/40 transition-colors"
                      onClick={() => toggleFaq('faq1')}
                    >
                      <span>How do I improve my speaking skills?</span>
                      <span className="text-xl">{openFaqs.faq1 ? '−' : '+'}</span>
                    </button>
                    
                    {openFaqs.faq1 && (
                      <div className="p-3 pt-0 text-white/80 text-sm">
                        Regular practice is key. Use our practice sessions daily, review your analytics, and focus on areas that need improvement. The AI coach will provide personalized feedback to help you progress.
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-black/30 rounded-lg overflow-hidden">
                    <button
                      className="w-full flex items-center justify-between p-3 text-white hover:bg-black/40 transition-colors"
                      onClick={() => toggleFaq('faq2')}
                    >
                      <span>Can I download my practice recordings?</span>
                      <span className="text-xl">{openFaqs.faq2 ? '−' : '+'}</span>
                    </button>
                    
                    {openFaqs.faq2 && (
                      <div className="p-3 pt-0 text-white/80 text-sm">
                        Yes, after each practice session, you can download your recording from the session summary page. This allows you to review your performance offline or share it with others for additional feedback.
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-black/30 rounded-lg overflow-hidden">
                    <button
                      className="w-full flex items-center justify-between p-3 text-white hover:bg-black/40 transition-colors"
                      onClick={() => toggleFaq('faq3')}
                    >
                      <span>How is my speech analyzed?</span>
                      <span className="text-xl">{openFaqs.faq3 ? '−' : '+'}</span>
                    </button>
                    
                    {openFaqs.faq3 && (
                      <div className="p-3 pt-0 text-white/80 text-sm">
                        We use advanced AI algorithms to analyze various aspects of your speech, including clarity, confidence, pace, and content. The system provides real-time feedback and detailed analytics to help you understand your strengths and areas for improvement.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
          
          {/* Privacy & Security */}
          <GlassCard className="p-6">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center mb-3">
                <HiShieldCheck className="w-6 h-6 text-red-500" />
              </div>
              <h2 className="text-xl font-semibold text-white">Privacy & Security</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <h3 className="text-white font-medium">Show Profile to Others</h3>
                  <p className="text-white/60 text-sm">Allow others to view your profile information</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.privacy.showProfile}
                    onChange={(e) => handleSettingChange('privacy', { ...settings.privacy, showProfile: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-white/10 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <h3 className="text-white font-medium">Share Activity</h3>
                  <p className="text-white/60 text-sm">Share your practice activity with the community</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.privacy.shareActivity}
                    onChange={(e) => handleSettingChange('privacy', { ...settings.privacy, shareActivity: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-white/10 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <h3 className="text-white font-medium">Allow Direct Messages</h3>
                  <p className="text-white/60 text-sm">Let other users send you direct messages</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.privacy.allowMessages}
                    onChange={(e) => handleSettingChange('privacy', { ...settings.privacy, allowMessages: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-white/10 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>
              
              <div className="pt-4 border-t border-white/10 mt-4">
                <h3 className="text-white font-medium mb-3 text-left">Security Options</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white">Two-Factor Authentication</span>
                    <button className="px-3 py-1.5 rounded-lg bg-black/30 text-white text-sm hover:bg-black/40 transition-colors">
                      Enable
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-white">Login History</span>
                    <button className="px-3 py-1.5 rounded-lg bg-black/30 text-white text-sm hover:bg-black/40 transition-colors">
                      View
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-white">Data & Privacy</span>
                    <button className="px-3 py-1.5 rounded-lg bg-black/30 text-white text-sm hover:bg-black/40 transition-colors">
                      Manage
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </AppLayout>
  );
}
