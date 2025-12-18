import Widget from '../widget/Widget'

function App() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Widget Demo
        </h1>
        <div className="max-w-md">
          <Widget />
        </div>
      </div>
    </div>
  )
}

export default App
