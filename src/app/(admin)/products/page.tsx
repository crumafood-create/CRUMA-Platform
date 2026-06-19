return (
  <main>
    <pre>
      {JSON.stringify(
        {
          error,
          count: products?.length,
          products,
        },
        null,
        2
      )}
    </pre>
  </main>
);
