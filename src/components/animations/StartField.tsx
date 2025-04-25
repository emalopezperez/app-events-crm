import { PointMaterial, Points } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'

function createSpecialShape(type, scale, depth, offsetX = 0) {
  switch (type) {
    case 'heart':
      return (t, i, total) => {
        let r
        if (Math.random() < 0.8) {
          r = Math.pow(0.6 + Math.random() * 0.4, 0.8)
        } else {
          r = Math.pow(Math.random(), 0.9)
        }

        const x = scale * 16 * Math.pow(Math.sin(t), 3)
        const y = scale * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))

        return [x * r * 0.15 + offsetX, y * r * 0.15, (Math.random() - 0.5) * depth * 0.3]
      }
    case 'flyAway':
      return (t, i, total) => {
        const angle = Math.random() * Math.PI * 2
        const distance = 20 + Math.random() * 30

        return [Math.cos(angle) * distance, Math.sin(angle) * distance, (Math.random() * 2 - 1) * distance * 2]
      }
    case 'flyIn':
      return (t, i, total) => {
        const phi = Math.random() * Math.PI * 2
        const costheta = Math.random() * 2 - 1
        const theta = Math.acos(costheta)
        const r = Math.cbrt(Math.random()) * depth

        return [r * Math.sin(theta) * Math.cos(phi), r * Math.sin(theta) * Math.sin(phi), r * Math.cos(theta)]
      }
    case 'circle':
      return (t, i, total) => {
        const r = Math.random() * 0.7 + 0.3
        return [Math.cos(t) * r * scale, Math.sin(t) * r * scale, (Math.random() - 0.5) * depth * 0.2]
      }
    case 'spiral':
      return (t, i, total) => {
        const r = Math.random() * 0.7 + 0.3
        const spiralTightness = 0.2
        return [
          Math.cos(t) * t * spiralTightness * scale * r,
          Math.sin(t) * t * spiralTightness * scale * r,
          (Math.random() - 0.5) * depth * 0.2,
        ]
      }
    default:
      return null
  }
}

function StarLayer({ count, speed, size, depth, color, starState = 'normal', layer = 0 }) {
  const points = useRef()
  const targetPositions = useRef(null)
  const initialPositions = useRef(null)
  const animationProgress = useRef(0)
  const { viewport } = useThree()
  const [currentState, setCurrentState] = useState(starState)
  const [needsReset, setNeedsReset] = useState(false)

  const adjustedSize = size * (viewport.width / 20)
  const adjustedDepth = depth * (viewport.width / 20)

  let shapeToUse = null
  if (currentState === 'flyAway') {
    shapeToUse = 'flyAway'
  } else if (currentState === 'flyIn') {
    shapeToUse = 'flyIn'
  } else if (currentState === 'heart') {
    shapeToUse = layer % 2 === 0 ? 'heart' : 'circle'
  }

  const createShapePosition = shapeToUse ? createSpecialShape(shapeToUse, adjustedDepth * 0.05, adjustedDepth) : null

  const calculateSpacePosition = () => {
    const phi = Math.random() * Math.PI * 2
    const costheta = Math.random() * 2 - 1
    const theta = Math.acos(costheta)
    const r = Math.cbrt(Math.random()) * adjustedDepth

    return [r * Math.sin(theta) * Math.cos(phi), r * Math.sin(theta) * Math.sin(phi), r * Math.cos(theta)]
  }

  const positions = useMemo(() => {
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const [x, y, z] = calculateSpacePosition()
      positions[i * 3] = x
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = z
    }
    initialPositions.current = positions.slice()
    return positions
  }, [count, adjustedDepth])

  useEffect(() => {
    if (starState !== currentState) {
      setCurrentState(starState)
      setNeedsReset(true)
    }
  }, [starState, currentState])

  useEffect(() => {
    if (needsReset && points.current) {
      if (currentState !== 'normal' && createShapePosition) {
        const newPositions = new Float32Array(count * 3)
        for (let i = 0; i < count; i++) {
          const t = Math.random() * Math.PI * 2
          const [x, y, z] = createShapePosition(t, i, count)
          newPositions[i * 3] = x
          newPositions[i * 3 + 1] = y
          newPositions[i * 3 + 2] = z
        }
        targetPositions.current = newPositions
      } else {
        targetPositions.current = initialPositions.current.slice()
      }
      animationProgress.current = 0
      setNeedsReset(false)
    }
  }, [needsReset, currentState, count, createShapePosition])

  useFrame((state, delta) => {
    if (points.current) {
      let currentSpeed = speed
      if (currentState === 'flyAway') currentSpeed = speed * 5
      else if (currentState === 'flyIn') currentSpeed = speed * 3

      if (currentState === 'normal') {
        points.current.rotation.x += delta * currentSpeed * 0.1
        points.current.rotation.y += delta * currentSpeed * 0.15
        points.current.rotation.z += delta * currentSpeed * 0.05
      } else if (currentState === 'heart') {
        points.current.rotation.x += delta * 0.01
        points.current.rotation.y += delta * 0.01
        points.current.rotation.z += delta * 0.005
      }

      const positionsArray = points.current.geometry.attributes.position.array

      const positions = new Float32Array(positionsArray.length)
      for (let i = 0; i < positionsArray.length; i++) {
        positions[i] = positionsArray[i]
      }

      if (targetPositions.current && animationProgress.current < 1) {
        let transitionSpeed = 0.6
        if (currentState === 'flyAway') transitionSpeed = 3.0
        else if (currentState === 'flyIn') transitionSpeed = 1.5
        else if (currentState === 'heart') transitionSpeed = 0.8

        animationProgress.current = Math.min(1, animationProgress.current + delta * transitionSpeed)

        let progress
        if (currentState === 'flyAway') {
          progress = easeInQuint(animationProgress.current)
        } else if (currentState === 'flyIn') {
          progress = easeOutQuint(animationProgress.current)
        } else {
          progress = easeInOutQuad(animationProgress.current)
        }

        for (let i = 0; i < positions.length; i++) {
          const target = targetPositions.current[i]
          const start = currentState === 'normal' ? positions[i] : initialPositions.current[i]
          positions[i] = start + (target - start) * progress
        }
      } else {
        for (let i = 0; i < positions.length; i += 3) {
          positions[i + 2] += delta * currentSpeed
          if (positions[i + 2] > adjustedDepth) {
            const [x, y, z] = calculateSpacePosition()
            positions[i] = x
            positions[i + 1] = y
            positions[i + 2] = -adjustedDepth
          }
        }
      }

      for (let i = 0; i < positionsArray.length; i++) {
        positionsArray[i] = positions[i]
      }

      points.current.geometry.attributes.position.needsUpdate = true
    }
  })

  function easeOutBack(x) {
    const c1 = 1.70158
    const c3 = c1 + 1
    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2)
  }

  function easeInOutQuad(x) {
    return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2
  }

  function easeInQuint(x) {
    return x * x * x * x * x
  }

  function easeOutQuint(x) {
    return 1 - Math.pow(1 - x, 5)
  }

  return (
    <Points ref={points} positions={positions} stride={3}>
      <PointMaterial
        transparent
        color={color}
        size={adjustedSize}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        opacity={0.7}
      />
    </Points>
  )
}

function SpaceScene({ starState }) {
  const { viewport } = useThree()

  const scaleFactor = Math.max(1, Math.min(3, viewport.width / 10))

  const baseStarCount = viewport.width > 2000 ? 15000 : 10000
  const secondaryStarCount = viewport.width > 2000 ? 4000 : 2500

  return (
    <group>
      <StarLayer
        count={Math.floor(baseStarCount * scaleFactor)}
        speed={0.2}
        size={viewport.width > 2000 ? 0.05 : 0.06}
        depth={viewport.width > 2000 ? 150 : 100}
        color="#ffffff"
        starState={starState}
        layer={0}
      />
      <StarLayer
        count={Math.floor(secondaryStarCount * scaleFactor)}
        speed={0.15}
        size={viewport.width > 2000 ? 0.08 : 0.09}
        depth={viewport.width > 2000 ? 75 : 50}
        color="#ffccd5"
        starState={starState}
        layer={1}
      />
      <StarLayer
        count={viewport.width > 2000 ? 80 : 50}
        speed={0.1}
        size={0.12}
        depth={25}
        color="#f8bbd0"
        starState={starState}
        layer={2}
      />
      <StarLayer
        count={viewport.width > 2000 ? 10 : 5}
        speed={0.1}
        size={0.12}
        depth={25}
        color="#FFD700"
        starState={starState}
        layer={3}
      />

      <fog attach="fog" args={['#000033', 0, 150 * scaleFactor]} />
    </group>
  )
}

function ResponsiveCanvas({ children }) {
  const [dpr, setDpr] = useState([1, 2])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 2560) {
        setDpr([0.8, 1.5])
      } else if (window.innerWidth > 1920) {
        setDpr([1, 1.8])
      } else {
        setDpr([1, 2])
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <Canvas
      camera={{
        position: [0, 0, 5],
        fov: 60,
        near: 0.1,
        far: 1000,
      }}
      dpr={dpr}
      resize={{ scroll: false, debounce: { scroll: 50, resize: 0 } }}
    >
      {children}
    </Canvas>
  )
}

export function StarField({ starState = 'normal' }) {
  return (
    <div className="absolute inset-0 z-0 h-full min-h-screen w-full">
      <div className="absolute inset-0 z-0 bg-black/90"></div>

      <div className="pointer-events-none absolute inset-0 z-0 opacity-60">
        <ResponsiveCanvas>
          <color attach="background" args={['#000033']} />
          <SpaceScene starState={starState} />
        </ResponsiveCanvas>
      </div>

      <div className="absolute inset-x-0 top-0 z-0 h-40 bg-gradient-to-b from-black/80 to-transparent"></div>
    </div>
  )
}
