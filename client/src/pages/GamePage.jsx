import { useParams, Link } from 'react-router-dom';
import { GAME_REGISTRY } from '../games';

export default function GamePage() {
  const { slug } = useParams();
  const GameComponent = GAME_REGISTRY[slug];

  if (!GameComponent) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="font-display text-xl text-mist">That game isn&apos;t built yet.</p>
        <Link to="/" className="btn-secondary mt-6 inline-flex">
          Back to games
        </Link>
      </div>
    );
  }

  return <GameComponent />;
}
