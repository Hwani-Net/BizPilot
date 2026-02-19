import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <h1 className="text-6xl font-bold gradient-text mb-4">404</h1>
      <p className="text-lg text-[hsl(var(--text-muted))] mb-8">
        페이지를 찾을 수 없습니다
      </p>
      <Link to="/" className="btn-primary">
        대시보드로 돌아가기
      </Link>
    </div>
  );
}
