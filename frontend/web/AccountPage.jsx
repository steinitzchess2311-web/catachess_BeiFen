
import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Container,
  Grid,
  TextField,
  Typography,
  CircularProgress
} from '@mui/material';

// Mock user data, in a real app this would come from an auth context or API call
const currentUser = {
  email: 'user@example.com',
  username: 'catadragon',
};

const AccountPage = () => {
  const [profile, setProfile] = useState({
    lichess_username: '',
    chesscom_username: '',
    fide_rating: '',
    cfc_rating: '',
    ecf_rating: '',
    chinese_athlete_title: '',
    fide_title: '',
    self_intro: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const response = await fetch('/user/profile'); // Correct API endpoint
        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }
        const data = await response.json();
        setProfile({
          lichess_username: data.lichess_username || '',
          chesscom_username: data.chesscom_username || '',
          fide_rating: data.fide_rating || '',
          cfc_rating: data.cfc_rating || '',
          ecf_rating: data.ecf_rating || '',
          chinese_athlete_title: data.chinese_athlete_title || '',
          fide_title: data.fide_title || '',
          self_intro: data.self_intro || '',
        });
      } catch (error) {
        console.error('Error fetching profile:', error);
        // Optionally show an error message to the user
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setProfile(prevProfile => ({
      ...prevProfile,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/user/profile', { // Correct API endpoint
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
      });

      if (!response.ok) {
        throw new Error('Failed to save profile');
      }

      // Optionally show a success notification
      console.log('Profile saved successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      // Optionally show an error message to the user
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Card sx={{ borderRadius: 3, boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Account Profile
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {currentUser.email}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
            Username: {currentUser.username}
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Lichess Username"
                name="lichess_username"
                value={profile.lichess_username}
                onChange={handleChange}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Chess.com Username"
                name="chesscom_username"
                value={profile.chesscom_username}
                onChange={handleChange}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={4} md={3}>
              <TextField
                fullWidth
                label="FIDE Rating"
                name="fide_rating"
                type="number"
                value={profile.fide_rating}
                onChange={handleChange}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={4} md={3}>
              <TextField
                fullWidth
                label="CFC Rating"
                name="cfc_rating"
                type="number"
                value={profile.cfc_rating}
                onChange={handleChange}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={4} md={3}>
              <TextField
                fullWidth
                label="ECF Rating"
                name="ecf_rating"
                type="number"
                value={profile.ecf_rating}
                onChange={handleChange}
                variant="outlined"
              />
            </Grid>
             <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="FIDE Title"
                name="fide_title"
                value={profile.fide_title}
                onChange={handleChange}
                variant="outlined"
                helperText="e.g., GM, IM, FM"
              />
            </Grid>
             <Grid item xs={12} sm={6} md={6}>
              <TextField
                fullWidth
                label="Chinese Athlete Title"
                name="chinese_athlete_title"
                value={profile.chinese_athlete_title}
                onChange={handleChange}
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Self Introduction"
                name="self_intro"
                multiline
                rows={4}
                value={profile.self_intro}
                onChange={handleChange}
                variant="outlined"
                helperText="A brief introduction about yourself."
              />
            </Grid>
          </Grid>
        </CardContent>
        <CardActions sx={{ justifyContent: 'flex-end', p: 2, pr: 4, pb: 3 }}>
          <Box sx={{ position: 'relative' }}>
            <Button
              variant="contained"
              color="primary"
              disabled={saving}
              onClick={handleSave}
              size="large"
            >
              Save Changes
            </Button>
            {saving && (
              <CircularProgress
                size={24}
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  marginTop: '-12px',
                  marginLeft: '-12px',
                }}
              />
            )}
          </Box>
        </CardActions>
      </Card>
    </Container>
  );
};

export default AccountPage;
