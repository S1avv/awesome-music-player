import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MediaCard } from './MediaCard';
import { BrowserRouter } from 'react-router-dom';

describe('MediaCard Component', () => {
  it('renders track title and subtitle correctly', () => {
    render(
      <BrowserRouter>
        <MediaCard
          title="Shape of You"
          subtitle="Ed Sheeran"
          trackPath="/path/to/song.mp3"
          isCurrentTrack={false}
          isPlaying={false}
          onPlayPauseClick={vi.fn()}
        />
      </BrowserRouter>
    );

    expect(screen.getByText('Shape of You')).toBeInTheDocument();
    expect(screen.getByText('Ed Sheeran')).toBeInTheDocument();
  });

  it('calls onPlayPauseClick when the play button is clicked', () => {
    const handlePlayClick = vi.fn();
    render(
      <BrowserRouter>
        <MediaCard
          title="Shape of You"
          subtitle="Ed Sheeran"
          trackPath="/path/to/song.mp3"
          isCurrentTrack={false}
          isPlaying={false}
          onPlayPauseClick={handlePlayClick}
        />
      </BrowserRouter>
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(handlePlayClick).toHaveBeenCalledTimes(1);
  });

  it('shows the Pause icon when it is the current track and is playing', () => {
    const { container } = render(
      <BrowserRouter>
        <MediaCard
          title="Shape of You"
          subtitle="Ed Sheeran"
          trackPath="/path/to/song.mp3"
          isCurrentTrack={true}
          isPlaying={true}
          onPlayPauseClick={vi.fn()}
        />
      </BrowserRouter>
    );

    // Look for the Pause icon class from lucide-react
    expect(container.querySelector('.lucide-pause')).toBeInTheDocument();
  });
});
